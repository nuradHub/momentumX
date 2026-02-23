import axios from "axios"

export const GetContractDetails = async (ctx, ca) => {
  try {
    const url = `https://api.dexscreener.com/latest/dex/tokens/${ca}`;
    const request = await axios.get(url);
    const pairs = request?.data?.pairs || [];

    const sortedPairs = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

    return sortedPairs.map((pair) => ({
      userId: ctx.from.id || "N/A",
      price: pair.priceUsd || "N/A",
      liquidity: pair.liquidity?.usd || "N/A",
      dex: pair.dexId || "N/A",
      chain: pair.chainId || 'N/A'
    }));
  } catch (err) {
    console.error("DexScreener Error:", err);
    return [];
  }
}