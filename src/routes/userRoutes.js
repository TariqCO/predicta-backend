import { Router } from "express";
import {
  deleteUserPrediction,
  loginUser,
  logout,
  registerUser,
  secure,
  usersPredictions,
} from "../controllers/userController.js";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/multer.js";
import { isfulfilledUsersPredictions } from "../middleware/isPredictionsFulfilled.js";

const router = Router();

router.post("/register", upload.single("photo"), registerUser);
router.post("/login", loginUser);
router.get("/logout", logout);

router.get("/myPredictions", verifyJWT, isfulfilledUsersPredictions, usersPredictions);
router.delete("/delete/:slug/:timeframe", verifyJWT, deleteUserPrediction);
router.get("/secure", verifyJWT, secure);

export default router;
