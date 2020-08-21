"use strict";

const _ = require("lodash");
const fs = require("fs");
const darbyDb = require("./darby_db");
const slackAction = require("./slack_action");
const endOfYearVideo = require("./end_of_year_video");

// Done only once on startup. There's probably a better way than json (yaml maybe?)
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
  fs.readFileSync("src/responses/corona_virus_sidekicks.JSON")
);
const START_ODDS_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/odds_start_odds.JSON")
);
const REJECT_ODDS_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/odds_rejected.JSON")
);
const SET_ODDS_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/odds_set_odds.JSON")
);
const ALREADY_PLAYING_ODDS_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/odds_already_playing.JSON")
);
const DM_FOR_ODDS_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/dm_for_odds_play.JSON")
);
const ODDS_MATCH_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/odds_match_responses.JSON")
);
const DB_QUOTES = JSON.parse(
  fs.readFileSync("src/responses/db_quotes.JSON")
)

const ODDS_MISMATCH_RESPONSES = JSON.parse(
  fs.readFileSync("src/responses/odds_mismatch_responses.JSON")
);

const GIVE_POINTS_REGEX = /^(\+\+|--)\s*<@(.*?)>/;
const GET_COMMAND_REGEX = /^\?([^\s]*)/;
const ADD_COMMAND_REGEX = /^!([^\s]*)\s*(.*$)/;
const UPPERCASE_REGEX = /^[^a-z]{5,}$/;
const DARBY_MENTIONED_REGEX = /darby/i;
const DM_ME_REGEX = /(?:^|\s)+dm\sme/i;
const HELP_ME_REGEX = /(?:^|\s)+(?:encourage|help)\sme/i;
const HELP_OTHER_REGEX = /(?:^|\s)+(?:encourage|help)\s<@(.*?)>/i;
const START_ODDS_REGEX = /^\$odds\s+<@(.*?)>\s*(.*)$/i;
const SET_ODDS_REGEX = /^\$odds\s*([0-9]*)$/i;
const PLAY_ODDS_REGEX = /^[0-9]+$/;
const DB_QUOTE_REGEX = /^db quote$/i;
const SEND_MESSAGE_REGEX = /send\sthis\sto\s<#([^\|]*)\|[^>]*>/i;
const CHANNELS_FOR_END_OF_YEAR_VIDEO = ['DN0MRV81E', 'DN2GV70UE'] 

const respond_to_event = event => {
  console.log(`Darby sees message: ${event.text}`);
  console.log(event);

  // The different types of events Darby is looking for
  // Each new type should have it's own function
  // 1. A message that wants to give or take away points
  // 2. A command message
  // 3. An uppercase message (or randomly 2 % of the time)
  if (!event.text) {
    return
  }

  // The end of year video is a special (hacked together) exception
  // so that Andras + Gege can make a video using Darby
  if(CHANNELS_FOR_END_OF_YEAR_VIDEO.includes(event.channel)){
    console.log("We are in an end of year video channel")
    endOfYearVideo.respondToEndOfYearVideo(event.text, event.channel)
  }

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
  } else if (event.text.match(PLAY_ODDS_REGEX)) {
    respondToOddsPlayEvent(event);
  } else if (event.text.match(DB_QUOTE_REGEX)) {
    respondToDbQuoteEvent(event);
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

  if (receiver === sender) {
    slackAction.sendMessage(
      "Try choosing a friend to play with you.",
      channelId
    );
  }

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
    } else {
      slackAction.sendMessage(
        getAlreadyPlayingOddsMessage(
          sender,
          receiver,
          oddsRecords[0].challenge
        ),
        channelId
      );
    }
  });
}

function respondToOddsPlayEvent(event) {
  if (event.channel_type !== "im") {
    return;
  }

  const userId = event.user;
  const oddsGuess = parseInt(event.text.match(PLAY_ODDS_REGEX)[0]);

  darbyDb.getOldestAcceptedOddsRecordForUser(userId, record => {
    if (!record) {
      return;
    }

    if (oddsGuess > record.odds || oddsGuess < 1) {
      slackAction.sendMessage(
        `You're outside the range (1 to ${record.odds}). Try again`,
        event.channel
      );
      return;
    }

    if (record.challenger_id === userId) {
      darbyDb.updateChallengerGuess(record.id, oddsGuess, (success) => {
        if (success && record.receiver_guess) {
          const guessesMatch = oddsGuess === record.receiver_guess
          finishOddsGame(record, guessesMatch)
        }
      })
    } else {
      darbyDb.updateReceiverGuess(record.id, oddsGuess, (success) => {
        if (success && record.challenger_guess) {
          const guessesMatch = oddsGuess === record.challenger_guess
          finishOddsGame(record, guessesMatch)
        }
      })
    }
  });
}

function finishOddsGame(record, guessesMatch) {
  console.log(`Finished an odds game with record:`)
  console.log(record)

  if (guessesMatch) {
    darbyDb.setGameStatus('done_and_matched', success => {
      if (success) {
        const message = getOddsMatchMessage(record.challenger_id, record.receiver_id, record.challenge)
        slackAction.sendMessage(message, record.channel_id);
      }
    })
  } else {
    darbyDb.setOddsGameStatus(record.id, 'done_and_mismatched', success => {
      if (success) {
        const message = getOddsMismatchMessage(record.challenger_id, record.receiver_id, record.challenge)
        slackAction.sendMessage(message, record.channel_id);
      }
    })
  }
}

function respondToSetOddsEvent(event) {
  const setOddsRegexMatch = event.text.match(SET_ODDS_REGEX);
  const oddsValue = parseInt(setOddsRegexMatch[1]);
  const userId = event.user;

  darbyDb.getOpenOddsRecordsForUser(userId, records => {
    const record = records[0];

    if (!record) {
      slackAction.sendMessage(
        "Error finding odds record. Please try oddsing again.",
        event.channel
      );
      return;
    }

    const sender = record.challenger_id;

    if (oddsValue === 0) {
      darbyDb.rejectOdds(record.id, success => {
        const message = success
          ? getRejectOddsMessage(sender, userId)
          : "UNABLE TO REJECT ODDS. PLEASE TRY AGAIN LATER.";
        slackAction.sendMessage(message, record.channel_id);
      });
    } else {
      darbyDb.setOddsValue(record.id, oddsValue, success => {
        if (!success) {
          slackAction.sendMessage(
            "UNABLE TO SET ODDS VALUE. PLEASE TRY AGAIN.",
            record.channel_id
          );
          return;
        }

        const publicChannelAnnouncement = getSetOddsMessage(
          sender,
          userId,
          oddsValue
        );

        const privateDmForOddsValue = getDmForOddsMessage(oddsValue);
        slackAction.sendMessage(publicChannelAnnouncement, record.channel_id);

        darbyDb.getDmChannelForUser(record.challenger_id, channelId => {
          slackAction.sendMessage(privateDmForOddsValue, channelId);
        });

        darbyDb.getDmChannelForUser(record.receiver_id, channelId => {
          slackAction.sendMessage(privateDmForOddsValue, channelId);
        });
      });
    }
  });
}

function respondToDbQuoteEvent(event) {
  // If the message is coming from Darby, ignore it
  if (event.bot_id) {
    return;
  }

  slackAction.sendMessage(getDbQuote(), event.channel);
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

function getSetOddsMessage(sender, receiver, odds) {
  return getResponseWithReplacement(SET_ODDS_RESPONSES, [
    sender,
    receiver,
    odds
  ]);
}

function getOddsMatchMessage(challenger, receiver, oddsPrompt) {
  return getResponseWithReplacement(ODDS_MATCH_RESPONSES, [challenger, receiver, oddsPrompt])
}

function getOddsMismatchMessage(challenger, receiver, oddsPrompt) {
  return getResponseWithReplacement(ODDS_MISMATCH_RESPONSES, [challenger, receiver, oddsPrompt])
}

function getDmForOddsMessage(oddsValue) {
  return getResponseWithReplacement(DM_FOR_ODDS_RESPONSES, [oddsValue]);
}

function getRejectOddsMessage(sender, receiver) {
  return getResponseWithReplacement(REJECT_ODDS_RESPONSES, [sender, receiver]);
}

function getAlreadyPlayingOddsMessage(sender, receiver, challenge) {
  return getResponseWithReplacement(ALREADY_PLAYING_ODDS_RESPONSES, [
    sender,
    receiver,
    challenge
  ]);
}

function getCapsResponse() {
  return _.sample(CAPS_RESPONSES.responses);
}

function getDbQuote() {
  return _.sample(DB_QUOTES.responses);
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
