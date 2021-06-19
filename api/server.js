'use strict';
require('dotenv').config();

const express = require('express');
const line = require('@line/bot-sdk');
const axios = require('axios');
const PORT = process.env.PORT || 3000;

const config = {
    channelSecret: process.env.CHANNEL_SECRET,
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

const app = express();

app.get('/', (req, res) => res.send(process.env.MESSAGE)); //ブラウザ確認用(無くても問題ない)
app.post('/webhook', line.middleware(config), (req, res) => {
    console.log(req.body.events);

    //ここのif分はdeveloper consoleの"接続確認"用なので削除して問題ないです。
    if(req.body.events[0].replyToken === '00000000000000000000000000000000' && req.body.events[1].replyToken === 'ffffffffffffffffffffffffffffffff'){
        res.send('Hello LINE BOT!(POST)');
        console.log('疎通確認用');
        return; 
    }

    Promise
      .all(req.body.events.map(handleEvent))
      .then((result) => res.json(result));
});

const client = new line.Client(config);

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }
  const params = event.message.text.replace(/　/g,' ').split(' ')

  if (params.length != 3) {
    return client.replyMessage(event.replyToken, {
      type: 'text',
      text: 'Failure: please write \"price(ex: 100) who(1or2) what(ex: coffee)\"'
    });
  }
  const price = Number(params[0]);
  const userId = Number(params[1]);
  const what = params[2];
  
  const URL = process.env.API_URL + '/payment';
  await axios.post(URL, {
    price: price,
    user_id: userId,
    what: what
  },
  {'Content-Type': 'text/plain'})
  .then(function (response) {console.log('success==========>', response)})
  .catch(function (response) {console.log('failure==========>',response)})

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: '登録しました' //実際に返信の言葉を入れる箇所
  });
}

(process.env.NOW_REGION) ? module.exports = app : app.listen(PORT);
console.log(`Server running at ${PORT}`);
