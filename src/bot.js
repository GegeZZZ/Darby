
'use strict'

const path = require('path');
const slack = require('slack')
const _ = require('lodash')
const fs = require('fs')
const config = require('./config')

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

const GIVE_POINTS_REGEX = /\+\+\s*<@(.*)>/

const respond_to_event = (event, storage) => {
  const message = event.text
  console.log(`Message looks like: ${message}`)
  
  if (event.bot_id == null && message === message.toUpperCase()) {
    send_message(_.sample(RESPONSES_TO_CAPS), event.channel)
  }

  if (event.bot_id == null && GIVE_POINTS_REGEX.test(message)) {
    const name = 'jjjj'
    console.log(`Store is ${storage}`)

    storage.getItem(name).then((result) => {
      console.log(`Result is ${result}`)
      if (result !== undefined && result >= 0) {
        const newResult = result + 1

        storage.setItem(name, newResult).then(() => {
          console.log(`Points: incremented ${name} to ${newResult}`)
        })
      }else{
        storage.setItem(name, 0).then(() => {
          console.log(`Points: added new key ${name}`)
        })
      }
    })
  }
}

module.exports = {send_message: send_message, respond_to_event: respond_to_event}
