
'use strict'

const path = require('path');
const slack = require('slack')
const config = require('./config')
const _ = require('lodash')
const fs = require('fs')

const send_message = (text, channel) => {
  slack.chat.postMessage({
    token: config('BOT_USER_TOKEN'),
    icon_emoji: config('ICON_EMOJI'),
    channel: channel,
    text: text
  }, (err) => {
    if (err) throw err

    console.log(`I sent the message "${text}" to the channel "${channel}"`)
  })
}

// Done only once on startup. There's probably a better way than json (yaml maybe?)
const RESPONSES_TO_CAPS_PATH = path.join('src', 'data', 'responses_to_caps.JSON');
const RESPONSES_TO_CAPS = JSON.parse(fs.readFileSync(RESPONSES_TO_CAPS_PATH)).responses

const respond_to_event = (event) => {
  const message = event.text
  
  if (event.bot_id == null && message === message.toUpperCase()) {
    send_message(_.sample(RESPONSES_TO_CAPS), event.channel)
  }
}

module.exports = {send_message: send_message, respond_to_event: respond_to_event}
