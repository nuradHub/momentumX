import axios from "axios"

export const GetContractDetails = async (ctx, ca) => {
  try {
    // 1. Try DexScreener
    const dexResponse = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${ca}`);
    
    // Crucial Change: Use optional chaining and default to empty array
    const pairs = dexResponse.data?.pairs;

    // Only process DexScreener if pairs is an actual array with items
    if (Array.isArray(pairs) && pairs.length > 0) {
      const sortedPairs = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
      
      return sortedPairs.map(pair => ({
        userId: ctx?.from?.id || "N/A",
        price: pair.priceUsd ? `$${pair.priceUsd}` : "N/A",
        liquidity: pair.liquidity?.usd ? `$${pair.liquidity.usd.toLocaleString()}` : "N/A",
        dex: pair.dexId || "N/A",
        chain: pair.chainId || "N/A",
        symbol: pair.baseToken?.symbol || "N/A"
      }));
    }

    // 2. Fallback to PumpPortal (The 'Mint' address works best here)
    console.log(`[RETRY] DexScreener null for ${ca}. Checking PumpPortal...`);
    const pumpResponse = await axios.get(`https://pumpportal.fun/api/data/token-info?mint=${ca}`);
    const data = pumpResponse.data;

    if (data && data.symbol) {
      // Calculate Price
      const vSol = Number(data.v_sol_in_bonding_curve);
      const vTokens = Number(data.v_tokens_in_bonding_curve);
      const priceInSol = (vSol / 1e9) / (vTokens / 1e6);
      const solLiquidity = vSol / 1e9;
    
      return [{
        userId: ctx?.from?.id || "N/A",
        symbol: data.symbol || "N/A",
        chain: "solana",
        dex: data.complete ? "Raydium" : "pump.fun",
        price: `${priceInSol.toFixed(9)} SOL`,
        liquidity: `${solLiquidity.toFixed(2)} SOL`
      }];
    }

    return [];
  } catch (err) {
    console.error("Data Fetch Error:", err.message);
    return [];
  }
};
