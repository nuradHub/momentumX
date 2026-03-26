import axios from "axios"

export const GetContractDetails = async (ctx, ca) => {
  try {
    // 1. Try DexScreener first as it has the 'pairs' array your code expects
    const dexResponse = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${ca}`);
    const pairs = dexResponse.data?.pairs || [];

    if (pairs.length > 0) {
      const sortedPairs = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      
      return sortedPairs.map(pair => ({
        userId: ctx?.from?.id || "N/A",
        price: pair.priceUsd || "N/A",
        liquidity: pair.liquidity?.usd || "N/A",
        dex: pair.dexId || "N/A",
        chain: pair.chainId || "N/A"
      }));
    }

    // 2. Fallback to PumpPortal if DexScreener has no data (for new tokens)
    const pumpResponse = await axios.get(`https://pumpportal.fun/api/data/token-info?mint=${ca}`);
    if (pumpResponse.data) {
      return [{
        userId: ctx?.from?.id || "N/A",
        price: "Bonding Curve",
        liquidity: "N/A",
        dex: "pump.fun",
        chain: "solana"
      }];
    }

    return [];
  } catch (err) {
    console.error("Data Fetch Error:", err.message);
    return [];
  }
};
