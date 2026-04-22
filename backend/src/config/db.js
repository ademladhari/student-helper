import mongoose from "mongoose";

export async function connectDB(mongoUri) {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing in environment variables");
  }

  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}
