
'use strict'

const slack = require('slack')
const config = require('./config')

const send_message = (text, channel) => {
  slack.chat.postMessage({
    token: config('BOT_USER_TOKEN'),
    icon_emoji: config('ICON_EMOJI'),
    channel: channel,
    text: text
  }, (err, data) => {
    if (err) throw err

    console.log(`I sent the message "${data.message.text}" to the channel "${data.message.channel}"`)
  })
}

module.exports = {send_message: send_message}
