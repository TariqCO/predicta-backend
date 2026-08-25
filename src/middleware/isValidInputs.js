import { checkValidPrediction } from "../services/checkValidPrediction.js";
import { getCurrentPrice } from "../services/currentPriceOfCoin.js";

const TIMEFRAME_LABELS = {
  24: "24 Hours",
  7: "7 Days",
  1: "1 Month",
};

const THRESHOLD_PERCENT_BY_SYMBOL = {
  BTC: 1.5,
  ETH: 1.5,
  DOGE: 2.5,
  SHIB: 3,
};
const DEFAULT_THRESHOLD_PERCENT = 2;

/**
 * Each rule below either returns an error message (validation failed) or
 * `null` (validation passed). isValidInputs just runs them in order and
 * stops at the first failure — that keeps the middleware itself a plain
 * loop instead of a wall of nested if/return blocks.
 */

// 1. A user can only have one active prediction per coin + timeframe.
function checkNoDuplicatePrediction(req, { slug, prediction }) {
  const hasActivePrediction = req.user.myPredictions.some(
    (p) => p.slug === slug && p.timeframe === prediction.timeframe
  );
  if (!hasActivePrediction) return null;

  const timeframeInHours = Number(prediction.timeframe);
  const label = TIMEFRAME_LABELS[timeframeInHours] || `${timeframeInHours} Hours`;
  return `⏳ You’ve already made a prediction for this coin in the selected timeframe (${label}). Please wait for it to be fulfilled before submitting a new one.`;
}

// 2. The written explanation must actually support the chosen direction.
async function checkTextMatchesDirection(req, { prediction }) {
  const isTextValid = await checkValidPrediction(prediction);
  if (isTextValid) return null;
  return "📝 Your explanation doesn't align with the chosen direction (Up or Down). Please adjust your reasoning.";
}

// 3. The target price must sit on the correct side of, and far enough
//    from, the current market price.
async function checkTargetPrice(req, { prediction, symbol }) {
  const currentPrice = await getCurrentPrice(symbol);
  const targetPrice = parseFloat(prediction.targetPrice);

  const thresholdPercent =
    THRESHOLD_PERCENT_BY_SYMBOL[symbol.toUpperCase()] || DEFAULT_THRESHOLD_PERCENT;
  const priceDiffPercent = Math.abs((targetPrice - currentPrice) / currentPrice) * 100;

  const isDirectionCorrect =
    (prediction.direction === "positive" && targetPrice > currentPrice) ||
    (prediction.direction === "negative" && targetPrice < currentPrice);

  if (!isDirectionCorrect) {
    const expected = prediction.direction === "positive" ? "higher" : "lower";
    return `📉 The target price must be ${expected} than the current market price ($${currentPrice}) to match the direction of your prediction.`;
  }

  if (priceDiffPercent < thresholdPercent) {
    return `⚠️ Your prediction must differ by at least ${thresholdPercent}% from the current market price ($${currentPrice}). Try setting a more ambitious target.`;
  }

  return null;
}

// 4. The fulfillment date must be in the future.
function checkFulfillmentInFuture(req, { prediction }) {
  const fulfillmentTime = new Date(prediction.fulfillmentTime);
  if (fulfillmentTime > new Date()) return null;
  return "⏰ The fulfillment time must be set in the future. Please select a valid time ahead of the current moment.";
}

const RULES = [
  checkNoDuplicatePrediction,
  checkTextMatchesDirection,
  checkTargetPrice,
  checkFulfillmentInFuture,
];

export const isValidInputs = async (req, res, next) => {
  const { prediction, slug, symbol } = req.body;

  try {
    for (const rule of RULES) {
      const errorMsg = await rule(req, { prediction, slug, symbol });
      if (errorMsg) return res.status(400).json({ msg: errorMsg });
    }

    // ✅ All validations passed
    next();
  } catch (error) {
    console.error("❌ Validation middleware error:", error.message);
    return res.status(500).json({
      msg: "❌ Something went wrong during validation. Please try again.",
    });
  }
};
