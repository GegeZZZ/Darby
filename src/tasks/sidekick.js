"use strict";

const darbyDb = require("../darby_db");
const slackAction = require("../slack_action");

darbyDb.getDmChannelForUser("UMX7Q9LFP", dmChannelId => {
  slackAction.sendMessage("TESTING OUT TASKS", dmChannelId);
});

darbyDb.getAllUserIds(_res => {
  console.log(_res);
  let notRes = ["UMX7Q9LFP", "UMZBQQ0KZ"];
  let userIdsLeftHalf = notRes.splice(0, notRes.length / 2);
  let userIdsRightHalf = notRes;

  for (let i = 0; i < userIdsRightHalf.length; i++) {
    slackAction.openDmWithUsers(
      userIdsLeftHalf[i],
      userIdsRightHalf[i],
      dmChannelId => {
        slackAction.sendMessage(
          `Hello <@${userIdsLeftHalf[i]}> and <@${userIdsRightHalf[i]}>! You're each other's sidekicks this week!`,
          dmChannelId
        );
      }
    );
  }
});
