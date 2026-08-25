import { userModel } from "../models/userModel.js";
import { getCurrentPrice } from "../services/currentPriceOfCoin.js";

// Works out the outcome of a single prediction against the current market
// price, mutating it in place if its status needs to change.
// Returns { outcome, wasModified, currentSummary }.
async function resolvePredictionOutcome(prediction, now) {
  let wasModified = false;

  const fulfillDate = new Date(prediction.fulfillmentTime);
  if (fulfillDate < now && prediction.outcome === "pending") {
    prediction.outcome = "expired";
    wasModified = true;
  }

  const currentPrice = await getCurrentPrice(prediction.symbol);
  const target = parseFloat(prediction.targetPrice);
  const current = parseFloat(currentPrice);

  const isFulfilled =
    (prediction.direction === "positive" && current >= target) ||
    (prediction.direction === "negative" && current <= target);

  if (isFulfilled && prediction.outcome === "pending") {
    prediction.outcome = "fulfilled";
    prediction.fulfilledAt = new Date();
    wasModified = true;
  }

  return {
    isFulfilled,
    wasModified,
    summary: {
      symbol: prediction.symbol,
      targetPrice: prediction.targetPrice,
      slug: prediction.slug,
      isFulfilled,
      direction: prediction.direction,
      createdAt: prediction.createdAt,
      fulfilledAt: prediction.fulfilledAt || null,
      outcome: prediction.outcome || "pending",
      logo: prediction.logo,
      timeframe: prediction.timeframe,
      priceWhenVoting: prediction.priceWhenVoting,
      confidence: prediction.confidence,
    },
  };
}

export const isfulfilledUsersPredictions = async (req, res, next) => {
  try {
    const { _id } = req.user;

    const user = await userModel.findById(_id);
    if (!user || !user.myPredictions?.length) {
      return res.status(404).json({ error: "User or predictions not found." });
    }

    const now = new Date();
    const results = [];
    let userWasModified = false;

    for (const prediction of user.myPredictions) {
      const { wasModified, summary } = await resolvePredictionOutcome(prediction, now);
      if (wasModified) userWasModified = true;
      results.push(summary);
    }

    if (userWasModified) {
      await user.save(); // 💾 Save only when changes made
    }

    req.filledPredictions = results;
    next();
  } catch (error) {
    console.error("❌ Error checking predictions:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
