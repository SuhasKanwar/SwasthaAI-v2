import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { config } from 'dotenv';
import { oauth2Client } from '../../config/oauth';
import prisma from '../../config/prisma';
import jwt from 'jsonwebtoken';

config();

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

interface GoogleUserInfo {
  email: string;
  given_name: string;
  family_name?: string;
}

export const getGoogleAuthURL = (req: Request, res: Response): void => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    include_granted_scopes: true
  });

  res.json({ url: authUrl });
};

export const handleGoogleCallback = async (
  req: Request & { query: { code?: string } },
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const code = req.query.code;
    if (!code) {
      res.status(400).json({ message: 'Authorization code is required' });
      return;
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = new OAuth2Client();
    if (!tokens.access_token) {
      throw new Error('Access token not provided');
    }
    
    oauth2.setCredentials({ access_token: tokens.access_token });
    
    const response = await oauth2.request<GoogleUserInfo>({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo'
    });

    const googleUser = response.data;

    // Check if user exists
    let user = await prisma.user.findFirst({
      where: { email: googleUser.email }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.given_name,
          lastName: googleUser.family_name || '',  // Use empty string if family_name is not provided
          googleAuth: true,
          // Set default values for required fields
          dateOfBirth: new Date('2000-01-01'), // Placeholder, should be updated by user
          gender: 'Prefer not to say',
          securityPin: await generateRandomPin() // Helper function to generate random PIN
        }
      });
    } else {
      // Update existing user's Google auth status
      await prisma.user.update({
        where: { id: user.id },
        data: { googleAuth: true }
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Create session log
    await prisma.sessionLog.create({
      data: { userId: user.id }
    });

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL is not defined');
    }

    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error) {
    next(error);
  }
};

// Helper function to generate random PIN
async function generateRandomPin(): Promise<string> {
  return Math.floor(100000 + Math.random() * 900000).toString();
}