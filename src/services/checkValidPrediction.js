import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

// 🧠 Initialize Gemini
const gemini = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * ✅ Validates if a prediction text aligns with the given direction.
 * Only returns `true` if AI is confident the text clearly supports the direction.
 */
export const checkValidPrediction = async ({ direction, text }) => {
  const prompt = `
You are a strict AI prediction validator. Given a market direction and a prediction text, determine if the text *clearly and directly* supports the specified direction:

- If the direction is "positive", the text must indicate confidence in upward movement, growth, bullish momentum, or optimism.
- If the direction is "negative", the text must indicate expectation of decline, drop, bearish trend, or pessimism.
- Do NOT accept vague, neutral, or unrelated explanations.
- If the text does not clearly support the direction, or contradicts it in any way, return "false".

Respond with only one word: "true" or "false" (lowercase, no punctuation).

Direction: ${direction}
Text: ${text}
`;

  try {
    const model = await gemini.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rawText = model.text?.toLowerCase().trim();

    return rawText === "true";
  } catch (error) {
    console.error("❌ Error validating prediction with Gemini:", error.message);
    return false; // Fail safe: assume invalid on error
  }
};
