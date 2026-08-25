import { Router } from "express";
import { addVote, allPredictions, getAverage } from "../controllers/cryptoControllers.js";
import { verifyJWT } from "../middleware/authMiddleware.js";
import { isValidInputs } from "../middleware/isValidInputs.js";

const router = Router();

router.post("/", verifyJWT, isValidInputs, addVote);
router.get("/:slug/:timeframe", getAverage);
router.get("/", allPredictions);

export default router;
