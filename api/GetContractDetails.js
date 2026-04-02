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
        chain: pair.chainId || "N/A",
        symbol: pair.baseToken?.symbol || "N/A"
      }));
    }

    // 2. Fallback to PumpPortal if DexScreener has no data (for new tokens)
    const pumpResponse = await axios.get(`https://pumpportal.fun/api/data/token-info?mint=${ca}`);
    const data = pumpResponse.data;

    if (data) {
      
      const priceInSol = (Number(data.v_sol_in_bonding_curve) / 1e9) / (Number(data.v_tokens_in_bonding_curve) / 1e6);

      const solLiquidity = Number(data.v_sol_in_bonding_curve) / 1e9;
    
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
