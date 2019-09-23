"use strict";

const darbyDb = require("../darby_db");
const darby = require("../darby");
const slackAction = require("../slack_action");
const _ = require("lodash");

darbyDb.getAllUserIds(_res => {
  console.log(_res);
  let notRes = _.shuffle(["UMX7Q9LFP", "UMZBQQ0KZ"]);
  let userIdsLeftHalf = notRes.splice(0, notRes.length / 2);
  let userIdsRightHalf = notRes;

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
