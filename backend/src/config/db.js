import mongoose from 'mongoose';

export async function connectDB(uri) {
  // Pin the database name so a URI without one (common with Atlas) doesn't fall back to "test"
  await mongoose.connect(uri, { dbName: process.env.MONGO_DB || 'lankalink', serverSelectionTimeoutMS: 15000 });
  console.log(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
}
