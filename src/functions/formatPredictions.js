export const formatPredictionSummaryPrompt = ({
  heading,
  symbol,
  texts = [],
  directions = [],
  fulfillments = [],
  targetPrices = [],
  timeframe,
}) => {
  const total = texts.length || directions.length;

  let summary = `You are a professional financial analyst AI assistant.\n`;
  summary += `Summarize the following ${total} predictions for ${heading} (${symbol}).\n\n`;
  summary += `Timeframe reference: If timeframe is "7d" it's a 7 days prediction, "24h" means 24 hours, and "1M" means 1 month. Give your assessment accordingly.\n\n`;
  summary += `Timeframe: ${timeframe}\n\n`;

  summary += `Before you begin, evaluate if the predictions are credible: if most texts are too vague, overly short, unclear, or repetitive with no real reasoning or financial logic, you should mark the entire prediction set as **not credible**.\n`;
  summary += `In such case, return a safe, general JSON response with generic summary and avoid providing strong directional verdicts.\n\n`;

  texts.forEach((text, idx) => {
    const dir = directions[idx] || "unknown";
    const time = fulfillments[idx] || "unspecified";
    const price = targetPrices[idx] || "N/A";

    summary += `Prediction ${idx + 1}:\n`;
    summary += `- Direction: ${dir === "positive" ? "Up" : "Down"}\n`;
    summary += `- Target Price: $${price}\n`;
    summary += `- Fulfillment Date: ${new Date(time).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })}\n`;
    summary += `- Reason: ${text.trim()}\n\n`;
  });

  summary += `---\n`;
  summary += `Now analyze the predictions and return the following response in **JSON object format only**, no explanation text:\n`;
  summary += `\n{\n`;
  summary += `  "mostCommonDirection": "Up" or "Down",\n`;
  summary += `  "verdict": "📈 Up" or "📉 Down",\n`;
  summary += `  "summary": "Short 2-3 sentence summary of key reasoning",\n`;
  summary += `  "notableReasons": ["list", "of", "most", "repeated", "phrases or patterns"]\n`;
  summary += `}\n`;

  return summary;
};
