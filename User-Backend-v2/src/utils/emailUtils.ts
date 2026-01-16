import nodemailer from 'nodemailer';
import prisma from '../config/prisma';
import { addMinutes } from 'date-fns';

// Create nodemailer transporter with Gmail OAuth2
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('SMTP server is ready to send messages');
  }
});

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (userId: string, email: string, otp: string): Promise<boolean> => {
  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Swastha AI ${process.env.EMAIL_USER}"`,
    to: email,
    subject: 'Your OTP for Authentication',
    text: `Your OTP is: ${otp}\nThis OTP will expire in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Authentication Code</h2>
        <p style="font-size: 16px;">Your OTP is:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
          ${otp}
        </div>
        <p style="color: #666; font-size: 14px; margin-top: 20px;">This code will expire in 5 minutes.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px;">If you didn't request this code, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    await prisma.otpVerification.create({
      data: {
        userId,
        otp,
        expiresAt: addMinutes(new Date(), 5)
      }
    });

    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

/**
 * Sends a generic email.
 * @param to Recipient email address.
 * @param subject Email subject.
 * @param text Plain text body.
 * @param html HTML body (optional).
 * @returns Promise<boolean> indicating success or failure.
 */
export const sendEmail = async (to: string, subject: string, text: string, html?: string): Promise<boolean> => {
  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Swastha AI ${process.env.EMAIL_USER}"`,
    to,
    subject,
    text,
    ...(html && { html })
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    return false;
  }
};


export const verifyOTP = async (userId: string, userOTP: string): Promise<boolean> => {
  try {
    // Get latest OTP verification record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        userId,
        otp: userOTP,
        expiresAt: {
          gt: new Date() // not expired
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!otpRecord) {
      return false;
    }

    // Invalidate all OTPs for this user
    await prisma.otpVerification.updateMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      data: {
        expiresAt: new Date() // Expire immediately
      }
    });

    return true;
  } catch (error) {
    console.error('OTP verification error:', error);
    return false;
  }
};
