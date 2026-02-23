import { MongoClient } from "mongodb";

// Cache the connection across Vercel function executions
let cachedClient = null;

export const Database = async () => {
  // 1. If we already have a connection, reuse it
  if (cachedClient) {
    return cachedClient.db('MomentumX-Database').collection('users');
  }

  // 2. Otherwise, create a new one
  const client = new MongoClient(process.env.MONGODB_URL);

  try {
    await client.connect(); // Explicitly connect to verify
    cachedClient = client;
    console.log("✅ New MongoDB Connection Established");
    
    return client.db('MomentumX-Database').collection('users');
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err);
    throw err;
  }
};