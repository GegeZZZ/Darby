"use strict";

const darbyDb = require("../darby_db");
const darby = require("../darby");
const slackAction = require("../slack_action");
const _ = require("lodash");

console.log("starting sidekicks");
console.log(`DAY: ${new Date().getDay()}`);
const today = new Date().getDay();

if (today === 1) {
  darbyDb.getAllUserIds(res => {
    console.log(res);
    let shuffledUserIds = _.shuffle(res);
    const userIdsLeftHalf = shuffledUserIds.splice(
      0,
      shuffledUserIds.length / 2
    );
    const userIdsRightHalf = shuffledUserIds;

    for (let i = 0; i < userIdsRightHalf.length; i++) {
      slackAction.openDmWithUsers(
        userIdsLeftHalf[i],
        userIdsRightHalf[i],
        dmChannelId => {
          darby.sendSidekicksMessage(
            userIdsLeftHalf[i],
            userIdsRightHalf[i],
            dmChannelId
          );
        }
      );
    }
  });
}
