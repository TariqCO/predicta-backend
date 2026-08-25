import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import { formatPredictionSummaryPrompt } from "../functions/formatPredictions.js";

// 🧠 Initialize the Gemini client with API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const getSummaryGemini = async ({
  heading,
  symbol,
  texts,
  directions,
  fulfillments,
  targetPrices,
  timeframe,
}) => {
  try {
    // 🧾 Create the prompt
    const prompt = formatPredictionSummaryPrompt({
      heading,
      symbol,
      texts,
      directions,
      fulfillments,
      targetPrices,
      timeframe,
    });

    // 📡 Call the Gemini model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      // Optional: add config if you want controlled output
      // config: { responseMimeType: "application/json" }
    });

    // 📄 Get raw text
    const rawText = response.text;

    // 🔍 Try to extract JSON from the text
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No valid JSON found in AI response.");

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed;
  } catch (error) {
    console.error("⚠️ Gemini summary parsing error:", error.message);

    return {
      verdict: "Unable to determine",
      summary: "AI response could not be parsed.",
      mostCommonDirection: "unknown",
      notableReasons: [],
    };
  }
};
