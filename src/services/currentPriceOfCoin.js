// ✅ Get the latest price of a coin from Binance
export const getCurrentPrice = async (symbol) => {
  const symbolInUpperCase = symbol.toUpperCase();

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${symbolInUpperCase}USDT`
    );

    // ❗ Handle failed responses (like 404 for invalid symbol)
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.statusText}`);
    }

    const data = await response.json();

    // ✅ Parse and return price as a float
    return parseFloat(data.price);
  } catch (err) {
    console.error("❌ Error fetching price:", err.message);
    return null; // Return null to signal failure
  }
};
