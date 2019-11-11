"use strict";

const _ = require("lodash");
const fs = require("fs");
const darbyDb = require("./darby_db");
const slackAction = require("./slack_action");

// Done only once on startup. There's probably a better way than json (yaml maybe?)
const NEW_USER_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/new_user.JSON")
);
const CAPS_RESPONSES = JSON.parse(fs.readFileSync("src/responses/caps.JSON"));
const POINTS_DOWN_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/points_down.JSON")
);
const POINTS_UP_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/points_up.JSON")
);
const CHANGE_OWN_RATING_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/change_own_rating.JSON")
);
const NEW_COMMAND_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/new_command.JSON")
);
const DM_MESSAGE_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/dm_message.JSON")
);
const ENCOURAGEMENT_MESSAGE_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/encouragement_message.JSON")
);
const SIDEKICKS_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/maine_retreat_sidekicks.JSON")
);
const START_ODDS_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/start_odds_response_messages.JSON")
);

const GIVE_POINTS_REGEX = /^(\+\+|--)\s*<@(.*?)>/;
const GET_COMMAND_REGEX = /^\?([^\s]*)/;
const ADD_COMMAND_REGEX = /^!([^\s]*)\s*(.*$)/;
const UPPERCASE_REGEX = /^[^a-z]+$/;
const DARBY_MENTIONED_REGEX = /darby/i;
const DM_ME_REGEX = /(?:^|\s)+dm\sme/i;
const HELP_ME_REGEX = /(?:^|\s)+(?:encourage|help)\sme/i;
const HELP_OTHER_REGEX = /(?:^|\s)+(?:encourage|help)\s<@(.*?)>/i;
const START_ODDS_REGEX = /^\$odds\s*([0-9]*)$/i;
const SET_ODDS_REGEX = /^\$odds\s*([0-9]*)$/i;

const respond_to_event = event => {
  console.log(`Darby sees message: ${event.text}`);

  // The different types of events Darby is looking for
  // Each new type should have it's own function
  // 1. A message that wants to give or take away points
  // 2. A command message
  // 3. An uppercase message (or randomly 2 % of the time)

  if (event.text.match(GIVE_POINTS_REGEX)) {
    respondToPointsEvent(event);
  } else if (event.text.match(GET_COMMAND_REGEX)) {
    respondToGetCommandEvent(event);
  } else if (event.text.match(ADD_COMMAND_REGEX)) {
    respondToAddCommandEvent(event);
  } else if (event.text.match(DM_ME_REGEX)) {
    respondToDmRequestEvent(event);
  } else if (event.text.match(HELP_ME_REGEX)) {
    respondToHelpSelfEvent(event);
  } else if (event.text.match(HELP_OTHER_REGEX)) {
    respondToHelpOtherEvent(event);
  } else if (event.text.match(UPPERCASE_REGEX) || Math.random() < 0.01) {
    respondToUppercaseEvent(event);
  } else if (event.text.match(START_ODDS_REGEX)) {
    respondToStartOddsEvent(event);
  } else if (event.text.match(SET_ODDS_REGEX)) {
    respondToSetOddsEvent(event);
  }

  // In ADDITION to any of those actions, we react if someone mentions darby
  if (event.text.match(DARBY_MENTIONED_REGEX)) {
    respondToDarbyMention(event);
  }
};

function respondToDmRequestEvent(event) {
  // Get (or create) the dm channel for the user
  darbyDb.getDmChannelForUser(event.user, (channelId, userName) => {
    console.log(`Received channel ID ${channelId} and user name ${userName}`);
    if (channelId && userName) {
      // Send a dm message to that channel
      slackAction.sendMessage(getDmMessage(userName), channelId);
    }
  });
}

function respondToHelpSelfEvent(event) {
  encourageUser(event.user);
}

function respondToHelpOtherEvent(event) {
  const userToEncourage = event.text.match(HELP_OTHER_REGEX)[1];

  encourageUser(userToEncourage);
}

function encourageUser(userToEncourage) {
  // Get (or create) the dm channel for the user
  darbyDb.getDmChannelForUser(userToEncourage, (channelId, userName) => {
    console.log(`Received channel ID ${channelId} and user name ${userName}`);
    if (channelId && userName) {
      // Send a dm message to that channel
      slackAction.sendMessage(getEncouragementMessage(userName), channelId);
    }
  });
}

function respondToDarbyMention(event) {
  slackAction.addEmoji("darby", event.channel, event.ts);
}

function respondToPointsEvent(event) {
  if (event.bot_id) {
    slackAction.sendMessage("I DON'T GIVE OUT POINTS", event.channel);
    return;
  }

  const pointRegexMatch = event.text.match(GIVE_POINTS_REGEX);

  // pointRegexMatch: [full string, -- or ++, userID]
  const action = pointRegexMatch[1];
  const userId = pointRegexMatch[2];

  if (userId != event.user) {
    const valueToAdd = action === "++" ? 1 : -1;

    darbyDb.userExists(userId, userExists => {
      if (userExists) {
        addPointsToUser(userId, valueToAdd, event);
      } else {
        addNewUser(userId, valueToAdd, event);
      }
    });
  } else {
    slackAction.sendMessage(getChangeOwnRatingResponse(userId), event.channel);
  }
}

function addNewUser(userId, valueToAdd, event) {
  darbyDb.addUser(userId, success => {
    if (success) {
      // slackAction.sendMessage(getNewUserResponse(userId), event.channel);
      addPointsToUser(userId, valueToAdd, event);
    }
  });
}

function respondToUppercaseEvent(event) {
  // If the message is coming from Darby, ignore it
  if (event.bot_id) {
    return;
  }

  slackAction.sendMessage(getCapsResponse(), event.channel);
}

function respondToGetCommandEvent(event) {
  const commandRegexMatch = event.text.match(GET_COMMAND_REGEX);

  const commandText = commandRegexMatch[1];

  darbyDb.getResponseToCommand(commandText, response => {
    if (response != null) {
      slackAction.sendMessage(response, event.channel);
    }
  });
}

function respondToAddCommandEvent(event) {
  const commandRegexMatch = event.text.match(ADD_COMMAND_REGEX);

  const commandText = commandRegexMatch[1];
  const outputText = commandRegexMatch[2];

  if (outputText.length > 0) {
    darbyDb.addCommand(commandText, outputText, event.user, result => {
      if (result) {
        slackAction.sendMessage(
          getAddedCommandResponse(commandText),
          event.channel
        );
      }
    });
  }
}

function respondToStartOddsEvent(event) {
  const regexMatch = event.text.match(START_ODDS_REGEX);
  const receiver = regexMatch[1];
  const challenge = regexMatch[2];
  const sender = event.user;
  const channelId = event.channel;

  darbyDb.getOpenOddsRecordsForUser(receiver, oddsRecords => {
    if (oddsRecords.length === 0) {
      darbyDb.createOddsRecord(
        receiver,
        sender,
        challenge,
        channelId,
        _oddsRecord => {
          slackAction.sendMessage(
            getStartOddsMessage(sender, receiver),
            channelId
          );
        }
      );
    }
  });
}

function sendSidekicksMessage(userOne, userTwo, dmChannelId) {
  slackAction.sendMessage(getSidekicksMessage(userOne, userTwo), dmChannelId);
}

function addPointsToUser(userId, valueToAdd, event) {
  darbyDb.getUserPoints(userId, currPoints => {
    if (currPoints != null) {
      darbyDb.setUserPoints(
        userId,
        currPoints + valueToAdd,
        (success, points) => {
          if (success) {
            slackAction.sendMessage(
              getUserPointsChangeResponse(userId, points, valueToAdd),
              event.channel
            );
          }
        }
      );
    }
  });
}

function getNewUserResponse(userId) {
  return getResponseWithReplacement(NEW_USER_RESPONSES, [userId]);
}

function getUserPointsChangeResponse(userId, points, valueToAdd) {
  const responses =
    valueToAdd === 1 ? POINTS_UP_RESPONSES : POINTS_DOWN_RESPONSES;

  return getResponseWithReplacement(responses, [userId, points]);
}

function getChangeOwnRatingResponse(userId) {
  return getResponseWithReplacement(CHANGE_OWN_RATING_RESPONSES, [userId]);
}

function getDmMessage(userName) {
  return getResponseWithReplacement(DM_MESSAGE_RESPONSES, [userName]);
}

function getEncouragementMessage(userName) {
  return getResponseWithReplacement(ENCOURAGEMENT_MESSAGE_RESPONSES, [
    userName.split(" ")[0]
  ]);
}

function getSidekicksMessage(userOne, userTwo) {
  return getResponseWithReplacement(SIDEKICKS_RESPONSES, [userOne, userTwo]);
}

function getStartOddsMessage(sender, receiver) {
  return getResponseWithReplacement(START_ODDS_RESPONSES, [sender, receiver]);
}

function getCapsResponse() {
  return _.sample(CAPS_RESPONSES.responses);
}

function getAddedCommandResponse(command) {
  return getResponseWithReplacement(NEW_COMMAND_RESPONSES, [command]);
}

function getResponseWithReplacement(responsesJson, replacements) {
  let response = _.sample(responsesJson.responses);

  for (var i = 0; i < responsesJson.placeholders.length; i++) {
    response = response.replace(responsesJson.placeholders[i], replacements[i]);
  }

  return response;
}

module.exports = {
  respond_to_event: respond_to_event,
  sendSidekicksMessage: sendSidekicksMessage
};
