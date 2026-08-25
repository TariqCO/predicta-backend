import jwt from "jsonwebtoken";
import { userModel } from "../models/userModel.js";

export const verifyJWT = async (req, res, next) => {
  try {
    // 🔐 Get token from cookie or header
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // ✅ Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    // 🔎 Find user (exclude password)
    const user = await userModel.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }

    console.error("❌ JWT verification failed:", err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};
