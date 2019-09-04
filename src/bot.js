
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
const RESPONSES_TO_CAPS = JSON.parse(fs.readFileSync('src/data/responses_to_caps.JSON'))
const RESPONSES_TO_NEW_USER = JSON.parse(fs.readFileSync('src/data/responses_to_new_user.JSON'))
const RESPONSES_TO_POINTS_UP = JSON.parse(fs.readFileSync('src/data/responses_to_points_up.JSON'))
const RESPONSES_TO_POINTS_DOWN = JSON.parse(fs.readFileSync('src/data/responses_to_points_down.JSON'))

const GIVE_POINTS_REGEX = /(\+\+|--)\s*<@(.*)>/

const respond_to_event = (event) => {
  const message = event.text
  console.log(`Message looks like: ${message}`)

  const pointRegexMatch = event.text.match(GIVE_POINTS_REGEX)
  
  if (event.bot_id == null && message === message.toUpperCase() && !pointRegexMatch) {
    send_message(_.sample(RESPONSES_TO_CAPS.responses), event.channel)
  }

  if (event.bot_id == null && pointRegexMatch) {

    // match: [full string, -- or ++, userID]
    const action = pointRegexMatch[1]
    const userId = pointRegexMatch[2]

    if (userId != event.user){
      const valueToAdd = action === '++' ? 1 : -1

      darbyDb.userExists(userId, (userExists) => {
        if (userExists) {
          addPointsToUser(userId, valueToAdd, event)
        } else {
          darbyDb.addUser(userId, (success) => {
            if (success) {
              send_message(
                _.sample(RESPONSES_TO_NEW_USER.responses).replace(
                  RESPONSES_TO_NEW_USER.user_replacement_string, userId), event.channel)
              addPointsToUser(userId, valueToAdd, event)
            }
          })
        }
      })
    }else {
      send_message(`Please don't try to change your own rating, <@${event.user}> :upside_down_face:`, event.channel)
    }
  }
}

function addPointsToUser(userId, valueToAdd, event) {
  darbyDb.getUserPoints(userId, (currPoints) => {
    if (currPoints !== -1) {
      darbyDb.setUserPoints(userId, currPoints + valueToAdd, (success, points) => {
        if (success) {
          if (valueToAdd === 1){
            send_message(
              _.sample(
                RESPONSES_TO_POINTS_UP.responses
              ).replace(
                RESPONSES_TO_POINTS_UP.points_replacement_string,
                points
              ).replace(
                RESPONSES_TO_POINTS_UP.user_replacement_string,
                userId
              ),
              event.channel
            )
          } else {
            send_message(
              _.sample(
                RESPONSES_TO_POINTS_DOWN.responses
              ).replace(
                RESPONSES_TO_POINTS_DOWN.points_replacement_string,
                points
              ).replace(
                RESPONSES_TO_POINTS_DOWN.user_replacement_string,
                userId
              ),
              event.channel
            )
          }
        }
      })
    }
  })
}

module.exports = {send_message: send_message, respond_to_event: respond_to_event}
