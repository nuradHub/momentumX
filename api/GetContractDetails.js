import axios from "axios"

export const GetContractDetails = async (ctx, ca) => {
  try {
    // --- OPTION 1: DEXSCREENER ---
    try {
      const dexResponse = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${ca}`);
      const pairs = dexResponse.data?.pairs;

      if (Array.isArray(pairs) && pairs.length > 0) {
        const sortedPairs = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
        return sortedPairs.slice(0, 1).map(pair => ({
          source: "DexScreener",
          userId: ctx?.from?.id || "N/A",
          price: pair.priceUsd ? `$${pair.priceUsd}` : "N/A",
          liquidity: pair.liquidity?.usd ? `$${pair.liquidity.usd.toLocaleString()}` : "N/A",
          dex: pair.dexId || "N/A",
          chain: pair.chainId || "N/A",
          symbol: pair.baseToken?.symbol || "N/A"
        }));
      }
    } catch (e) { console.log("DexScreener failed or empty"); }

    // --- OPTION 2: JUPITER PRICE API ---
    // Jupiter is very reliable for any token with a pool on Raydium/Orca/Meteora
    try {
      const jupResponse = await axios.get(`https://api.jup.ag/price/v2?ids=${ca}`);
      const jupData = jupResponse.data?.data?.[ca];

      if (jupData && jupData.price) {
        return [{
          source: "Jupiter",
          userId: ctx?.from?.id || "N/A",
          symbol: "TOKEN", // Jup Price API doesn't always return symbol
          chain: "solana",
          dex: "Aggregated",
          price: `$${parseFloat(jupData.price).toFixed(10)}`,
          liquidity: "Check Dex" // Jup Price v2 doesn't give liquidity directly
        }];
      }
    } catch (e) { console.log("Jupiter API failed"); }

    // --- OPTION 3: PUMPPORTAL (Bonding Curve Fallback) ---
    try {
      const pumpResponse = await axios.get(`https://pumpportal.fun/api/data/token-info?mint=${ca}`);
      const data = pumpResponse.data;

      if (data && data.symbol) {
        const vSol = Number(data.v_sol_in_bonding_curve);
        const vTokens = Number(data.v_tokens_in_bonding_curve);
        const priceInSol = (vSol / 1e9) / (vTokens / 1e6);
        const solLiquidity = vSol / 1e9;
      
        return [{
          source: "PumpPortal",
          userId: ctx?.from?.id || "N/A",
          symbol: data.symbol || "N/A",
          chain: "solana",
          dex: data.complete ? "Raydium" : "pump.fun",
          price: `${priceInSol.toFixed(9)} SOL`,
          liquidity: `${solLiquidity.toFixed(2)} SOL`
        }];
      }
    } catch (e) { console.log("PumpPortal failed"); }

    return []; // No data found in any API
  } catch (err) {
    console.error("General Data Fetch Error:", err.message);
    return [];
  }
};
