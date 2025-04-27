// index.js

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Set up __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please free it or use another port.`);
      process.exit(1);
  } else {
      throw err;
  }
});


// Middleware
app.use(express.json());

// Improved CORS settings
app.use(cors({
  origin: 'http://localhost:5173', // Replace with your frontend URL
  credentials: true,
}));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vaccination', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1); // Exit if MongoDB connection fails
  });

// Define MongoDB Schema and Models
import { Coordinator, Student, VaccinationDrive } from './models/index.js';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Routes
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import vaccinationDriveRoutes from './routes/vaccinationDrives.js';
import reportsRoutes from './routes/reports.js';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/vaccination-drives', vaccinationDriveRoutes);
app.use('/api/reports', reportsRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the School Vaccination Management System API 🎯' });
});

// Global Error Handler (optional but good practice)
app.use((err, req, res, next) => {
  console.error('Unexpected Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export default app;