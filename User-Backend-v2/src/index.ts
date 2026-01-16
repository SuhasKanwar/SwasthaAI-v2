import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import authRoutes from './routes/authRoutes/authRoutes';
import oauthRoutes from './routes/authRoutes/oauthRoutes';
import profileRoutes from './routes/physicalHealthRoutes/userRoutes/profileRoutes';
import physicalHealthRoutes from './routes/physicalHealthRoutes';
import addressRoutes from './routes/physicalHealthRoutes/userRoutes/addressRoutes';
import feedbackRoutes from './routes/physicalHealthRoutes/userRoutes/feedbackRoutes';
import doctorRoutes from './doctorsBackend/doctorRoutes';
import doctorSearchRoutes from './routes/doctorSearchRoutes';
import appointmentRoutes from './routes/appointmentRoutes';
import medAlertRoutes from './routes/medAlertRoutes';
import { errorHandler } from './middleware/errorHandler';

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint (placing it before middleware to ensure it's always accessible)
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/users', profileRoutes); // Keep profile routes under /api/users
app.use('/api/physical-health', physicalHealthRoutes); // This correctly mounts address and feedback under /api/physical-health/*
// Remove duplicate mountings for address and feedback under /api/users
app.use('/api/addresses', addressRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/doctors/search', doctorSearchRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medalert', medAlertRoutes);

// Handle 404
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'fail',
    message: 'Route not found'
  });
});

// Global error handling - use type assertion to help TypeScript understand the middleware signature
app.use(errorHandler as express.ErrorRequestHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
