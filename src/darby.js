
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
const NEW_COMMAND_RESPONSES = JSON.parse(fs.readFileSync('src/responses/new_command.JSON'))

const GIVE_POINTS_REGEX = /^(\+\+|--)\s*<@(.*)>/
const GET_COMMAND_REGEX = /^\?([^\s]*)/
const ADD_COMMAND_REGEX = /^!([^\s]*)\s*(.*$)/
const UPPERCASE_REGEX = /^[^a-z]*$/

const respond_to_event = (event) => {
  console.log(`Darby sees message: ${event.text}`)

  // The different types of events Darby is looking for
  // Each new type should have it's own function
  // 1. A message that wants to give or take away points
  // 2. A command message
  // 3. An uppercase message (or randomly 2 % of the time)

  if(event.text.match(GIVE_POINTS_REGEX)) {
    respondToPointsEvent(event)
  } else if(event.text.match(GET_COMMAND_REGEX)) {
    respondToGetCommandEvent(event)
  } else if(event.text.match(ADD_COMMAND_REGEX)) {
    respondToAddCommandEvent(event)
  } else if(event.text.match(UPPERCASE_REGEX) || Math.random() < 0.02) {
    respondToUppercaseEvent(event)
  }
}

function respondToPointsEvent(event) {
  if (event.bot_id) {
    sendMessage("I DON'T GIVE OUT POINTS", event.channel)
    return
  }

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
  // If the message is coming from Darby, ignore it
  if (event.bot_id) {
    return
  }

  sendMessage(getCapsResponse(), event.channel)
}

function respondToGetCommandEvent(event) {
  const commandRegexMatch = event.text.match(GET_COMMAND_REGEX)

  const commandText = commandRegexMatch[1]

  darbyDb.getResponseToCommand(commandText, (response) => {
    if (response != null) {
      sendMessage(response, event.channel)
    }
  })
}

function respondToAddCommandEvent(event) {
  const commandRegexMatch = event.text.match(ADD_COMMAND_REGEX)

  const commandText = commandRegexMatch[1]
  const outputText = commandRegexMatch[2]

  if (outputText.length > 0){
    darbyDb.addCommand(commandText, outputText, event.user, (result) => {
      if (result) {
        sendMessage(getAddedCommandResponse(commandText), event.channel)
      }
    })
  }
}

function addPointsToUser(userId, valueToAdd, event) {
  darbyDb.getUserPoints(userId, (currPoints) => {
    if (currPoints != null) {
      darbyDb.setUserPoints(userId, currPoints + valueToAdd, (success, points) => {
        if (success) {
          sendMessage(getUserPointsChangeResponse(userId, points, valueToAdd), event.channel)
        }
      })
    }
  })
}

function getNewUserResponse(userId) {
  return getResponseWithReplacement(NEW_USER_RESPONSES, [userId])
}

function getUserPointsChangeResponse(userId, points, valueToAdd) {
  const responses = valueToAdd === 1 ? POINTS_UP_RESPONSES : POINTS_DOWN_RESPONSES

  return getResponseWithReplacement(responses, [userId, points])
}

function getChangeOwnRatingResponse(userId) {
  return getResponseWithReplacement(CHANGE_OWN_RATING_RESPONSES, [userId])
}

function getCapsResponse() {
  return _.sample(CAPS_RESPONSES.responses)
}

function getAddedCommandResponse(command) {
  return getResponseWithReplacement(NEW_COMMAND_RESPONSES, [command])
}

function getResponseWithReplacement(responsesJson, replacements){
  let response = _.sample(responsesJson.responses)

  for (var i = 0; i < responsesJson.placeholders.length; i++) {
    response = response.replace(responsesJson.placeholders[i], replacements[i])
  }

  return response
}

function sendMessage(text, channel) {
  slack.chat.postMessage({
    token: config('BOT_USER_TOKEN'),
    channel: channel,
    text: text.toUpperCase()
  }, (err) => {
    if (err) throw err

    console.log(`I sent the message "${text}" to the channel "${channel}"`)
  })
}

module.exports = {respond_to_event: respond_to_event}
