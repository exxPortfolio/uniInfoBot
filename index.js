const bot = require('node-telegram-bot-api')
const {telegramMessageHandler, InitializeComponents} = require("./storage/package");
const cfg = require('./configuration.json')
const useSearchEngine = require("./storage/searchengine");

const client = new bot(cfg.bot_api_key, {
  polling: true
});

client.on('webhook_error', (error) => {
});
client.on('polling_error', (error) => {
});

InitializeComponents.prototype.init().catch((err) => {
})

client.on('text', async msg => {
  await telegramMessageHandler.prototype.gotMessageByUser(msg, client)
    .catch((err) => console.log(err))
})

client.on('message', async msg => {
  await telegramMessageHandler.prototype.gotFileByUser(msg, client)
    .catch((err) => console.log(err))
})

client.on('callback_query', function onCallbackQuery(callbackQuery) {
  client.answerCallbackQuery(callbackQuery.id)
    .then(async () => {
      await useSearchEngine.prototype.getValueByIndex(callbackQuery.data, callbackQuery.message, client)
        .catch((err) => console.log(err))
    })
})
