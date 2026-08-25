import { CryptoModel } from "../models/cryptoModel.js";
import { userModel } from "../models/userModel.js";
import { uploadOnCloudinary } from "../services/cloudinary.js";
import fs from "fs/promises";

/* ────────── 1. TOKEN HELPER ───────────────────────────── */
export const generateAccessAndRefreshToken = async (userId) => {
  const user = await userModel.findById(userId);
  if (!user) throw new Error("User not found while issuing tokens");

  const refreshToken = user.generateRefreshToken();
  const accessToken = user.generateAccessToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { refreshToken, accessToken };
};

/* ────────── 2. REGISTER USER ──────────────────────────── */
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const filePath = req.file?.path;

    let profilePic = "";
    if (filePath) {
      const upload = await uploadOnCloudinary(filePath);
      profilePic = upload?.secure_url || "";
    }

    if (await userModel.exists({ email })) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const user = await userModel.create({
      name,
      email,
      password,
      profileImage: profilePic,
    });

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
      user._id
    );

    // 🧹 Delete temp file now that it's uploaded to Cloudinary
    await deleteTempFile(filePath);

    return res
      .status(201)
      .cookie("accessToken", accessToken, cookieOpts())
      .cookie("refreshToken", refreshToken, cookieOpts({ httpOnly: true }))
      .json({
        message: "User registered successfully",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profileImage: user.profileImage,
          refreshToken,
          accessToken,
        },
      });
  } catch (err) {
    console.error("Register error:", err);

    // 🧹 Cleanup temp file on error
    await deleteTempFile(req.file?.path);

    return res.status(500).json({ error: "Server error" });
  }
};

/* ────────── 3. LOGIN USER ─────────────────────────────── */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email }).select("+password");
    if (!user || !(await user.correctPassword(password))) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOpts())
      .cookie("refreshToken", refreshToken, cookieOpts({ httpOnly: true }))
      .json({
        message: "Login successful",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          refreshToken,
          accessToken,
        },
      });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
};

/* ────────── 4. GET USER'S PREDICTIONS ─────────────────── */
export const usersPredictions = async (req, res) => {
  try {
    if (!req.filledPredictions) {
      return res.status(400).json({ error: "No prediction data available." });
    }

    res.status(200).json(req.filledPredictions);
  } catch (error) {
    console.error("❌ Error sending fulfilled predictions:", error);
    res.status(500).json({ error: "Failed to retrieve predictions." });
  }
};

/* ────────── 5. DELETE A USER PREDICTION ───────────────── */
// Fields keyed by predictedBy (only filtered out for this user + timeframe)
const FIELDS_FILTERED_BY_USER = ["directions"];
// Fields with no predictedBy on each entry (filtered by timeframe only)
const FIELDS_FILTERED_BY_TIMEFRAME_ONLY = [
  "texts",
  "confidence",
  "targetPrices",
  "fulfillmentTimes",
  "fulfilled",
];

export const deleteUserPrediction = async (req, res) => {
  const { slug, timeframe } = req.params;

  if (!req.user) {
    return res.status(401).json({ msg: "Unauthorized" });
  }

  const userId = req.user._id;

  try {
    const coinDoc = await CryptoModel.findOne({ slug });
    if (!coinDoc) return res.status(404).json({ msg: "Prediction not found" });

    for (const field of FIELDS_FILTERED_BY_USER) {
      coinDoc.prediction[field] = coinDoc.prediction[field].filter(
        (entry) =>
          entry.timeframe !== timeframe ||
          entry.predictedBy?.toString() !== userId.toString()
      );
    }

    for (const field of FIELDS_FILTERED_BY_TIMEFRAME_ONLY) {
      coinDoc.prediction[field] = coinDoc.prediction[field].filter(
        (entry) => entry.timeframe !== timeframe
      );
    }

    await coinDoc.save();

    // 🧹 Remove from user's myPredictions
    await userModel.findByIdAndUpdate(userId, {
      $pull: { myPredictions: { slug, timeframe } },
    });

    res.status(200).json({ msg: "✅ Your prediction has been successfully deleted." });
  } catch (error) {
    console.error("❌ Error deleting prediction:", error);
    res.status(500).json({ msg: "Failed to delete prediction" });
  }
};

/* ────────── 6. LOGOUT USER ────────────────────────────── */
export const logout = (req, res) => {
  res
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .json({ message: "Logged out successfully" });
};

/* ────────── 7. PROTECTED ENDPOINT ─────────────────────── */
export const secure = async (req, res) => {
  return res.json({ user: req.user });
};

/* ────────── HELPERS ────────────────────────────────────── */
function cookieOpts(override = {}) {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    // "none" requires "secure: true" or browsers silently drop the cookie —
    // that combo only works over HTTPS, so use "lax" for local HTTP dev.
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    ...override,
  };
}

async function deleteTempFile(filePath) {
  if (!filePath) return;
  try {
    await fs.unlink(filePath);
  } catch (err) {
    console.error("🧹 Cleanup error:", err.message);
  }
}
