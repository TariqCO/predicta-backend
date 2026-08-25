// src/models/User.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import "dotenv/config";

const userSchema = new mongoose.Schema(
  {
    /* ── basic identity ─────────────────────────────── */
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 40,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // never return by default
    },
    profileImage: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    myPredictions: [
      {
        predictionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Prediction",
        },
        slug: { type: String },
        symbol: { type: String },
        logo: { type: String },
        createdAt: { type: String },
        targetPrice: { type: String },
        priceWhenVoting: { type: String },
        direction: { type: String },
        timeframe: { type: String },
        confidence: { type: String },
        fulfilledAt: {
          type: Date,
          default: null,
        },
        outcome: {
          type: String,
          enum: ["pending", "fulfilled", "failed", "expired"],
          default: "pending",
        },
      },
    ],
  },
  { timestamps: true }
);

/* Hash password before save */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

/* ───── src/models/User.js (only the method) ───────── */
userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

/* === TOKEN HELPERS === */
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id }, // payload
    process.env.JWT_ACCESS_SECRET, // SECRET!
    { expiresIn: "7d" }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET, // DIFFERENT secret
    { expiresIn: "30d" }
  );
};

export const userModel = mongoose.model("User", userSchema);
