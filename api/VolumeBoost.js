import { Markup } from "telegraf";
import { GetContractDetails } from "./GetContractDetails.js";
import path from 'path'
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const imageUrl = path.join(__dirname, 'img', 'volume-booster.png')

export const volumeBoost = () => ({
  media: {
    source: imageUrl,
    caption: `📉Volume Boost work by simulating Trading activity, which can make your Token appear more popular and attractive to potential investors.\n\n`+
            `<i>This increased visibility can lead to more real trades and, ultimately, a stronger market position for your token. I've looked into a few options, kindly choose from below price trend to determine how long and how far you want your token trade limits to Reach</i>`,
    parse_mode: 'HTML'
  },
  extra: Markup.inlineKeyboard([
    [Markup.button.callback('1.20 SOL || Iron Boost⛓️ ', 'Vol_1.20')],
    [Markup.button.callback('2 SOL || Bronze Boost🥉', 'Vol_2')],
    [Markup.button.callback('5.1 SOL || Silver Boost🥈', 'Vol_5.1')],
    [Markup.button.callback('⚡7.5 SOL || Gold Boost🥇', 'Vol_7.5')],
    [Markup.button.callback('Back', 'Back'), Markup.button.callback('Menu', 'Menu')]
  ])
})

export const volBoostAmount = (amount, boost) => ({
  media: {
    caption: `📄<code>Enter Contract Address (CA)</code>\n\n`+
      `<code>You selected ${amount} SOL ${boost}</code>`,
    parse_mode: 'HTML'
  },
  extra: Markup.keyboard([
    ['🚫Cancel']
  ]).oneTime().resize()
})


