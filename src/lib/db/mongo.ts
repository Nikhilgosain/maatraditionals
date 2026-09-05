import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongoDB() {
  if (mongoose.connection.readyState === 1) {
    isConnected = true;
    return;
  }

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not defined');
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      family: 4,
    });
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (error) {
    isConnected = false;
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

export function isMongoReady() {
  return mongoose.connection.readyState === 1;
}
