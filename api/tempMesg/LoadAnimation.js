
export const LoadAnimation = (ctx, msg) => {
  const frames = ["⏳", "⌛", "🔄"];
  let i = 0;

  const interval = setInterval(async () => {
    try {
      await ctx.telegram.editMessageText(
        ctx.chat.id,
        msg.message_id,
        undefined,
        `Loading ${frames[i++ % frames.length]}`
      );
    } catch (err) {
      if (err.description && err.description.includes("message is not modified")) {
        return;
      }
      
      clearInterval(interval);
    }
  }, 1000);

  return interval;
};