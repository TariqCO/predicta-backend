import axios from "axios";
import slugify from "slugify";
import { CryptoModel } from "../models/cryptoModel.js";


// ✅ Fetch trending coins from CoinGecko and sync with Binance symbols
export async function getTrendingFromCoinGecko() {
  try {
    // 📈 Step 1: Get trending coins from CoinGecko
    const url = "https://api.coingecko.com/api/v3/search/trending";
    const response = await axios.get(url);
    const trendingCoins = response.data.coins;

    // 🟡 Step 2: Get Binance-supported symbols
    const binanceUrl = "https://api.binance.com/api/v3/exchangeInfo";
    const binanceResponse = await axios.get(binanceUrl);
    const symbolsData = binanceResponse.data.symbols;

    // 🔤 Step 3: Map CoinGecko trending coins
    const allCoins = trendingCoins.map((coin) => ({
      heading: coin.item.name,
      slug: slugify(`${coin.item.name}-prediction`, { lower: true }),
      category: "Crypto Market",
      logo: coin.item.large,
      symbol: coin.item.symbol.toUpperCase(),
    }));

    // 🔎 Step 4: Build a set of Binance-listed coins
    const binanceCoinsSet = new Set();
    symbolsData.forEach((pair) => {
      binanceCoinsSet.add(pair.baseAsset.toUpperCase());
      binanceCoinsSet.add(pair.quoteAsset.toUpperCase());
    });

    // ✅ Step 5: Filter coins available on Binance
    const filteredCoinsArray = allCoins.filter((item) =>
      binanceCoinsSet.has(item.symbol)
    );

    // 🧠 Step 6: Check existing predictions by symbol
    const existingDocs = await CryptoModel.find({});
    const existingSymbols = new Set(
      existingDocs.map((coin) => coin.symbol.toUpperCase())
    );

    // ➕ Step 7: Filter only new coins not in DB
    const newCoins = filteredCoinsArray.filter(
      (item) => !existingSymbols.has(item.symbol)
    );

    // 💾 Step 8: Insert if either DB is empty OR new coins exist
    if (existingDocs.length === 0 || newCoins.length > 0) {
      await CryptoModel.insertMany(newCoins);
    }

    return { allCoins: filteredCoinsArray, newCoins };
  } catch (error) {
    console.error("❌ Error fetching trending coins:", error.message);
    throw new Error("Failed to fetch trending coins.");
  }
}
