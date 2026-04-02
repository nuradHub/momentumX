import { Markup } from "telegraf";
import { GetContractDetails } from "./GetContractDetails.js";
import path from 'path'
import { fileURLToPath } from "url";
import { Database } from "../MongoDB/Database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageUrl = path.join(__dirname, 'img', 'momentumX.jpeg')

export const startMessage = (ctx) => ({
  media: {
    source: imageUrl,
    caption: `👋 Welcome <b>${ctx.from.first_name}</b> to MomentumX Official Bot\n\n` +
      `<a href='https://t.me/momentumXVolume_bot'>MomentumX</a> is a specialized bot that can genuinely change how a collection is approached.\n\n` +
      `Many Developers are looking for smarter ways to grow assets, and that's where using the ` +
      `<a href='https://t.me/momentumXVolume_bot'>MomentumX Official Bot</a> comes in.\n\n` +
      `The bot acts as a tireless assistant. <b>MomentumX</b>`,
    parse_mode: 'HTML'
  },
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('⚡Start Pumps', 'Start Pumps')],
    [Markup.button.callback('💳Balance-INFO', 'Balance-INFO'), Markup.button.callback('📊Volume Boosts', 'Volume_Boosts')],
    [Markup.button.callback('💊Trending', 'Trending'), Markup.button.callback('🛡️Connect', 'Connect')],
    [Markup.button.callback('💬Support', 'support')]
  ])
})

export const pumpBoost = () => ({
  media: {
    caption: "<b>⚪️The Best and Fastest Trend bot for creating ATH bump orders.</b>\n\n" +
      "Supported Platform: Pumpfun and Raydium.\n\n" +
      "MomentumX BumpBot charges a one-time fee of 0.25-0.55 SOL per token, making it the Fastest and Easiest bump bot ever!\n\n" +
      "🌐<a href='https://t.me/momentumXVolume_bot'>https://Momentum</a>",
    parse_mode: 'HTML'
  },
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('⚡0.25 || Bump Boost', 'Bump_0.25')],
    [Markup.button.callback('⚡0.35 || Bump Boost', 'Bump_0.35')],
    [Markup.button.callback('⚡0.45 || Bump Boost', 'Bump_0.45')],
    [Markup.button.callback('⚡0.55 || Bump Boost', 'Bump_0.55')],
    [Markup.button.callback('🔙 Back', 'Back'), Markup.button.callback('Menu', 'Menu')]
  ])
})

export const pumpBoostAmount = (amount) => ({
  media: {
    caption: `⚡️<b>Ordering ${amount} SOL Bump Boost….</b>\n\n` +
      `📄<code>Enter Contract Address (CA)</code>\n\n` +
      `Please enter project CA;`,
    parse_mode: 'HTML'
  },
  extra: Markup.keyboard([
    ['🚫Cancel']
  ]).oneTime().resize()
})

export const verifySolanaAddress = (address) => {
  const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return solanaRegex.test(address)
}

export const verifyInformation = async (ctx, ca) => {

  const data = await GetContractDetails(ctx, ca)

  if (!data || data.length === 0) {
    return {
      caption: `⚠️ <b>Token Not Found</b>\n\nWe couldn't find details for <code>${ca}</code> on DexScreener. Please verify the CA and try again.`,
      parse_mode: 'HTML',
      extra: Markup.inlineKeyboard([[Markup.button.callback('Back', 'Back')]])
    };
  }

  const details = data[0]

  const media = {
    caption: `Name: <b>${ctx.from.first_name}</b>\n\n` +
      `✅ <code>CA: ${ca}</code>\n\n` +
      `<a href='https://pump.fun/coin/${ca}'>https://pump.fun/coin/${ca}</a>\n\n` +
      `📊 Information:\n\n` +
      `• <b>User ID</b>: ${details?.userId}\n\n` +
      `• <b>Price</b>: ${details?.price}\n\n` +
      `• <b>Liquidity</b>: ${details?.liquidity}\n\n` +
      `• <b>DEX</b>: ${details?.dex}\n\n` +
      `• <b>Chain</b>: ${details?.chain}\n\n` +
      `• <b>Symbol</b>: ${details?.symbol}\n\n` +
      `<b>Please confirm your project contract address CA before proceeding.</b>`,
    parse_mode: 'HTML',
    extra: Markup.inlineKeyboard([
      [Markup.button.callback('✅Confirm', 'Confirm')]
    ])
  }

  try {
    const collection = await Database();

    const client = await collection.findOne({ id: ctx.from.id });

    if (!client) {
      return await ctx.reply(`❌ User ${ctx.from.id} not found in database.`);
    }

    await collection.updateOne(
      { id: ctx.from.id },
      { $set: {
        ca: ca,
        symbol: details?.symbol || "N/A"
      } 
      },
      { upsert: true }
    );
  }catch(err){
    console.log(err)
  }

  return media

}

export const verifiedMessage = (amount, solAddress) => ({

  media: {
    caption: `✅Token Successfully added✅\n\n` +
      `<b>• One last Step: Payment Required</b>\n\n` +
      `⌛️ Please complete the one time fee payment of ${amount} SOL to the following wallet address:\n\n` +
      `Wallet:\n\n` +
      `<code>${solAddress}</code>\n\n` +
      `<b>(Tap to copy)</b>\n\n` +
      `Once you have completed the payment within the given timeframe, your bump order will be activated !`,
    parse_mode: 'HTML'
  },
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('✅ Confirm payment', 'Confirm_payment')]
  ])
})

export const confirmTransation = () => ({
  media: {
    caption: `🔗 <b> Transaction Hash Required</b>\n\n` +
      `<b>Please send your transaction hash below and await immediate confirmation….</b>`,
    parse_mode: 'HTML'
  },
  extra: Markup.keyboard([
    ['🚫Cancel']
  ]).oneTime().resize()
})

export const verifyTransactionHash = (text) => {
  
  const hashRegex = /^[1-9A-HJ-NP-Za-km-z]{64,88}$/;
  
  const solscanRegex = /solscan\.io\/tx\/[1-9A-HJ-NP-Za-km-z]{64,88}/;

  return hashRegex.test(text) || solscanRegex.test(text);
};

export const sendTransactionHash = (ctx, messageText)=> ({
  media: {
    caption: `<b>🚨 USER INFORMATION</b>\n\n`+
            `🆔 USER_ID: <code>${ctx.from.id}</code>\n\n` +
            `👤 USER_NAME: ${ctx.from.first_name}\n\n` +
            `💬 MESSAGE: <code>${messageText}</code>\n\n`+
            `New Payment Received reply with <b><code>/update_payment [userId] [amount]</code></b>`,
    parse_mode: 'HTML'
  }
})

export const contactSupport = ()=> ({
  media: {
    caption: `<b>👨‍💻 Our Support Team</b>\n\n` + `Choose an admin to message:`,
    parse_mode: 'HTML'
  },
  extra: Markup.inlineKeyboard([
      [Markup.button.url('💰 MomentumX Support', 'https://t.me/momentumXVolume_support')],
      [Markup.button.callback('⬅️ Back', 'Menu')]
  ])
})
