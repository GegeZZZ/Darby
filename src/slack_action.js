"use strict";

const slack = require("slack");
const config = require("./config");

function sendMessage(text, channel) {
  slack.chat.postMessage(
    {
      token: config("BOT_USER_TOKEN"),
      channel: channel,
      text: text.toUpperCase()
    },
    err => {
      if (err) throw err;

      console.log(`I sent the message "${text}" to the channel "${channel}"`);
    }
  );
}

function addEmoji(emojiName, channel, timestamp) {
  slack.reactions.add(
    {
      token: config("BOT_USER_TOKEN"),
      name: emojiName,
      timestamp: timestamp,
      channel: channel
    },
    err => {
      if (err) {
        console.log(
          `Unable to put emoji ${emojiName} in the ts ${timestamp} in channel ${channel}`
        );
        throw err;
      }

      console.log(
        `I put the emoji ${emojiName} in the ts ${timestamp} in channel ${channel}`
      );
    }
  );
}

function getUsersList(usersDataCallback) {
  slack.users.list(
    {
      token: config("BOT_USER_TOKEN")
    },
    (err, result) => {
      if (err) {
        console.log(`Unable to get users list.`);
        throw err;
      }

      usersDataCallback(result.members);
    }
  );
}

function openDmWithUsers(userIdOne, userIdTwo, callback) {
  slack.conversations.open(
    {
      token: config("BOT_USER_TOKEN"),
      users: `${userIdOne},${userIdTwo}`
    },
    (err, result) => {
      if (err) {
        console.log(
          `Unable to open Dm/IM with users ${userIdOne} and ${userIdTwo}.`
        );
        throw err;
      }

      console.log(
        `Successfully opened DM with users ${userIdOne} and ${userIdTwo} (channel ${result.channel.id})`
      );
      return callback(result.channel.id);
    }
  );
}

function openDmWithUser(userId, callback) {
  slack.im.open(
    {
      token: config("BOT_USER_TOKEN"),
      user: userId
    },
    (err, result) => {
      if (err) {
        console.log(`Unable to open Dm/IM with user ${userId}.`);
        throw err;
      }

      console.log(
        `Successfully opened DM with user ${userId} (channel ${result.channel.id})`
      );
      return callback(result.channel.id);
    }
  );
}

module.exports = {
  sendMessage: sendMessage,
  addEmoji: addEmoji,
  getUsersList: getUsersList,
  openDmWithUser: openDmWithUser,
  openDmWithUsers: openDmWithUsers
};
