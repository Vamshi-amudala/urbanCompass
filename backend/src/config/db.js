import mongoose from 'mongoose';

export async function connectDatabase(mongoUri) {
  if (!mongoUri) {
    throw new Error('Missing MongoDB URI');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });
  return mongoose.connection;
}


