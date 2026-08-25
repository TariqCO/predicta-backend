import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// ✅ GET 24hr market stats from Binance
router.get("/ticker24h/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toUpperCase();

  try {
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Binance API error: ${response.statusText}`,
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ Error fetching Binance data:", err.message);
    res.status(500).json({ error: "Failed to fetch from Binance" });
  }
});

// ✅ GET historical price from CoinGecko (7d, 30d)
router.get("/historical/:symbol", async (req, res) => {
  const symbol = req.params.symbol.toLowerCase().replace("usdt", "");
  const days = req.query.days || "7"; // default to 7 days

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${symbol}/market_chart?vs_currency=usd&days=${days}&interval=daily`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(response.status).json({
        error: `CoinGecko API error: ${response.statusText}`,
      });
    }

    const data = await response.json();

    if (!data.prices || data.prices.length === 0) {
      return res.status(404).json({ error: "No price data found" });
    }

    // Use the earliest data point in the returned array (oldest price)
    const [timestamp, price] = data.prices[0];

    res.json({ price: parseFloat(price.toFixed(2)) });
  } catch (err) {
    console.error("❌ Error fetching CoinGecko historical price:", err.message);
    res.status(500).json({ error: "Failed to fetch historical price" });
  }
});

export default router;
