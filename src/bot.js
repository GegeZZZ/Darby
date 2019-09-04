
'use strict'

const path = require('path');
const slack = require('slack')
const _ = require('lodash')
const fs = require('fs')
const config = require('./config')
const darbyDb = require('./darby_db')

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

const RESPONSES_TO_NEW_USER_PATH = path.join('src', 'data', 'responses_to_new_user.JSON');
const RESPONSES_TO_NEW_USER_JSON = JSON.parse(fs.readFileSync(RESPONSES_TO_NEW_USER_PATH))

const GIVE_POINTS_REGEX = /(\+\+|--)\s*<@(.*)>/

const respond_to_event = (event) => {
  const message = event.text
  console.log(`Message looks like: ${message}`)
  
  if (event.bot_id == null && message === message.toUpperCase()) {
    send_message(_.sample(RESPONSES_TO_CAPS), event.channel)
  }

  const pointRegexMatch = event.text.match(GIVE_POINTS_REGEX)
  if (event.bot_id == null && pointRegexMatch) {

    // match: [full string, -- or ++, userID]
    const action = pointRegexMatch[1]
    const userId = pointRegexMatch[2]

    const valueToAdd = action === '++' ? 1 : -1

    darbyDb.userExists(userId, (userExists) => {
      if (userExists) {
        darbyDb.getUserPoints(userId, (currPoints) => {
          if (currPoints !== -1) {
            darbyDb.setUserPoints(userId, currPoints + valueToAdd, (success, points) => {

            })
          }
        })
      } else {
        darbyDb.addUser(userId, (success) => {
          if (success) {
            send_message(
              _.sample(RESPONSES_TO_NEW_USER_JSON.responses).replace(
                RESPONSES_TO_NEW_USER_JSON.userid_replacement_string, userId), event.channel)
          }
        })
      }
    })
  }
}

module.exports = {send_message: send_message, respond_to_event: respond_to_event}
