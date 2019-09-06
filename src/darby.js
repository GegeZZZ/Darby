
'use strict'

const slack = require('slack')
const _ = require('lodash')
const fs = require('fs')
const config = require('./config')
const darbyDb = require('./darby_db')

// Done only once on startup. There's probably a better way than json (yaml maybe?)
const NEW_USER_RESPONSES = JSON.parse(fs.readFileSync('src/responses/new_user.JSON'))
const CAPS_RESPONSES = JSON.parse(fs.readFileSync('src/responses/caps.JSON'))
const POINTS_DOWN_RESPONSES = JSON.parse(fs.readFileSync('src/responses/points_down.JSON'))
const POINTS_UP_RESPONSES = JSON.parse(fs.readFileSync('src/responses/points_up.JSON'))
const CHANGE_OWN_RATING_RESPONSES = JSON.parse(fs.readFileSync('src/responses/change_own_rating.JSON'))

const GIVE_POINTS_REGEX = /(\+\+|--)\s*<@(.*)>/
const COMMAND_REGEX = /!([^\s]*)/
const UPPERCASE_REGEX = /^[^a-z]*$/

const respond_to_event = (event) => {
  // If the message is coming from Darby, ignore it
  if (event.bot_id) {
    return
  }

  console.log(`Darby sees message: ${event.text}`)

  // The different types of events Darby is looking for
  // Each new type should have it's own function
  // 1. A message that wants to give or take away points
  // 2. A command message
  // 3. An uppercase message (or randomly 2 % of the time)

  if(event.text.match(GIVE_POINTS_REGEX)) {
    respondToPointsEvent(event)
  } else if(event.text.match(COMMAND_REGEX)) {
    respondToCommandEvent(event)
  } else if(event.text.match(UPPERCASE_REGEX) || Math.random() < 0.02) {
    respondToUppercaseEvent(event)
  }
}

function respondToPointsEvent(event) {
  const pointRegexMatch = event.text.match(GIVE_POINTS_REGEX)

  // pointRegexMatch: [full string, -- or ++, userID]
  const action = pointRegexMatch[1]
  const userId = pointRegexMatch[2]

  if (userId != event.user){
    const valueToAdd = action === '++' ? 1 : -1

    darbyDb.userExists(userId, (userExists) => {
      if (userExists) {
        addPointsToUser(userId, valueToAdd, event)
      } else {
        addNewUser(userId, valueToAdd, event)
      }
    })
  }else {
    sendMessage(getChangeOwnRatingResponse(userId), event.channel)
  }
}

function addNewUser(userId, valueToAdd, event) {
  darbyDb.addUser(userId, (success) => {
    if (success) {
      sendMessage(getNewUserResponse(userId), event.channel)
      addPointsToUser(userId, valueToAdd, event)
    }
  })
}

function respondToUppercaseEvent(event) {
  sendMessage(getCapsResponse(), event.channel)
}

function respondToCommandEvent(event) {
  if (event.text === '!zaccor2020') {
    sendMessage(':austin_salad: :austin_salad: :austin_salad:', event.channel)
  }
}

function addPointsToUser(userId, valueToAdd, event) {
  darbyDb.getUserPoints(userId, (currPoints) => {
    if (currPoints != null) {
      darbyDb.setUserPoints(userId, currPoints + valueToAdd, (success, points) => {
        if (success) {
          if (valueToAdd === 1){
            sendMessage(getPointsUpResponse(userId, points), event.channel)
          } else {
            sendMessage(getPointsDownResponse(userId, points), event.channel)
          }
        }
      })
    }
  })
}

function getNewUserResponse(userId) {
  return getResponseWithReplacement(
    NEW_USER_RESPONSES.responses,
    [NEW_USER_RESPONSES.user_replacement_string],
    [userId]
  )
}

function getChangeOwnRatingResponse(userId) {
  return getResponseWithReplacement(
    CHANGE_OWN_RATING_RESPONSES.responses,
    [CHANGE_OWN_RATING_RESPONSES.user_replacement_string],
    [userId]
  )
}

function getCapsResponse() {
  return _.sample(CAPS_RESPONSES.responses)
}

function getPointsDownResponse(userId, points) {
  return getResponseWithReplacement(
    POINTS_DOWN_RESPONSES.responses,
    [POINTS_DOWN_RESPONSES.points_replacement_string, POINTS_DOWN_RESPONSES.user_replacement_string],
    [points, userId]
  )
}

function getPointsUpResponse(userId, points) {
  return getResponseWithReplacement(
    POINTS_UP_RESPONSES.responses,
    [POINTS_UP_RESPONSES.points_replacement_string, POINTS_UP_RESPONSES.user_replacement_string],
    [points, userId]
  )
}

function getResponseWithReplacement(responses, placeholders, replacements){
  let response = _.sample(responses)

  for (var i = 0; i < placeholders.length; i++) {
    response = response.replace(placeholders[i], replacements[i])
  }

  return response
}

function sendMessage(text, channel) {
  slack.chat.postMessage({
    token: config('BOT_USER_TOKEN'),
    channel: channel,
    text: text
  }, (err) => {
    if (err) throw err

    console.log(`I sent the message "${text}" to the channel "${channel}"`)
  })
}

module.exports = {respond_to_event: respond_to_event}
