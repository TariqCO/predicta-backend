import 'dotenv/config';
import mongoose from 'mongoose';

export const dbConnection = async () => {
  try {
    // 🌐 Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ Mongo connection failed:", err.message);
    process.exit(1); // 🔁 Exit app on DB failure
  }
};
