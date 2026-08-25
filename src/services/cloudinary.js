import { v2 as cloudinary } from "cloudinary";
import "dotenv/config";

// ✅ Uploads image to Cloudinary
export const uploadOnCloudinary = async (file) => {
  try {
    // 🔧 Configure Cloudinary (should ideally be done once globally)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_API_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_SECRET_KEY,
    });

    if (!file) {
      throw new Error("No file provided for upload.");
    }

    // ⬆️ Upload file to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file, {
      public_id: "profileImage", // Optional: can customize this
      folder: "user_profiles",   // Optional: organize uploads
    });

    return uploadResult;
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error.message);
    return null;
  }
};
