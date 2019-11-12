"use strict";

const _ = require("lodash");
const mysql = require("mysql");

const darbyDb = mysql.createConnection(process.env.JAWSDB_URL);

darbyDb.connect();

const userExists = (userId, callback) => {
  darbyDb.query(
    "SELECT * FROM `user_points` WHERE `user_id` = ?;",
    [userId],
    function(err, res) {
      console.log("this.sql", this.sql);
      if (err) {
        console.log(err);
        return callback(false);
      }

      return callback(res.length > 0);
    }
  );
};

const getUserPoints = (userId, callback) => {
  darbyDb.query(
    "SELECT `points` FROM `user_points` WHERE `user_id` = ?;",
    [userId],
    function(err, rows) {
      console.log("this.sql", this.sql);
      if (err) {
        console.log(err);
        return callback(null);
      }

      return callback(rows[0].points);
    }
  );
};

const setUserPoints = (userId, points, callback) => {
  darbyDb.query(
    "UPDATE `user_points` SET `points` = ? WHERE `user_id` = ?;",
    [points, userId],
    function(err, res) {
      console.log("this.sql", this.sql);

      if (err) {
        console.log(
          `Unable to update points for user ${userId} (error: ${err}`
        );
        return callback(false);
      }

      console.log(`User ${userId} points set to ${points}`);
      return callback(true, points);
    }
  );
};

const addUser = (userId, callback) => {
  darbyDb.query(
    "INSERT INTO `user_points` (`user_id`, `points`) VALUES (?, ?);",
    [userId, 0],
    function(err, res) {
      console.log("this.sql", this.sql);

      if (err) {
        console.log(`Unable to add user ${userId} (error: ${err})`);
        return callback(false);
      }

      console.log(`Successfully added user ${userId}`);
      return callback(true);
    }
  );
};

const addCommand = (command, output, userId, callback) => {
  darbyDb.query(
    "INSERT INTO `user_commands` (`command_name`, `command_output`, `user_id`) VALUES (?, ?, ?);",
    [command, output, userId],
    function(err, res) {
      console.log("this.sql", this.sql);

      if (err) {
        console.log(`Unable to add command ${command} (error: ${err})`);
        return callback(false);
      }

      console.log(
        `Successfully added command ${command} with output ${output} by user ${userId}`
      );
      return callback(true);
    }
  );
};

const getResponseToCommand = (command, callback) => {
  darbyDb.query(
    "SELECT `command_output` FROM `user_commands` WHERE `command_name` = ?",
    [command],
    function(err, res) {
      console.log("this.sql", this.sql);

      if (err) {
        console.log(`Error selecting command ${command} (err: ${err})`);
        return callback(null);
      }

      if (res.length === 0) {
        console.log(`No entry found for command ${command}`);
        return callback(null);
      }

      console.log(`Sucessfully found entry for command ${command}.`);
      return callback(_.sample(res).command_output);
    }
  );
};

const usersTableFull = callback => {
  darbyDb.query("SELECT * FROM `users`", [], function(err, res) {
    console.log("this.sql", this.sql);
    if (err) {
      console.log(err);
      return callback(false);
    }

    return callback(res.length > 0);
  });
};

const fillUsersTable = (users, callback) => {
  users.forEach(user => {
    console.log(`I want to write the single piece: ${user}`);
    // Note that it would be faster to make this one call, but this should only run once ever.
    darbyDb.query(
      "INSERT INTO `users` (`user_id`, `username`, `real_name`, `dm_channel_id`) VALUES (?, ?, ?, ?);",
      [user.id, user.name, user.real_name, user.dm_channel_id],
      function(err) {
        console.log("this.sql", this.sql);

        if (err) {
          console.log(`Unable to add user ${user} (error: ${err})`);
          return callback(false);
        }

        console.log(`Successfully added user for user Id ${user.id}`);
        return callback(true);
      }
    );
  });
};

const getDmChannelForUser = (user, callback) => {
  darbyDb.query(
    "SELECT `real_name`, `dm_channel_id` FROM `users` WHERE `user_id` = ?",
    [user],
    function(err, res) {
      console.log("this.sql", this.sql);

      if (err) {
        console.log(`Error selecting user ${user} (err: ${err})`);
        return callback();
      }

      if (res.length === 0) {
        console.log(`No entry found for user ${user}`);
        return callback();
      }

      console.log(`Sucessfully found entry for user ${user}.`);
      return callback(res[0].dm_channel_id, res[0].real_name);
    }
  );
};

const getAllUserIds = callback => {
  darbyDb.query("SELECT `user_id` FROM `users`", function(err, res) {
    console.log("this.sql", this.sql);

    if (err) {
      console.log(`Error selecting user ids (err: ${err})`);
      return callback();
    }

    if (res.length === 0) {
      console.log(`No users found`);
      return callback();
    }

    console.log(`Sucessfully completed user ids fetch: ${res}`);
    return callback(res.map(user => user.user_id));
  });
};

const getOpenOddsRecordsForUser = (userId, callback) => {
  darbyDb.query(
    "SELECT `*` FROM `odds_records` WHERE `status` not in (?, ?) AND `receiver_id` = ?;",
    ["completed", "rejected", userId],
    function(err, rows) {
      console.log("this.sql", this.sql);
      if (err) {
        console.log(err);
        return callback(null);
      }

      return callback(rows);
    }
  );
};

const getOldestPendingOddsRecordForUser = (userId, callback) => {
  darbyDb.query(
    "SELECT `*` FROM `odds_records` WHERE `status` = ? AND (`receiver_id` = ? OR `challenger_id` = ?);",
    ["pending", userId, userId],
    function(err, rows) {
      console.log("this.sql", this.sql);
      if (err) {
        console.log(err);
        return callback(null);
      }

      return callback(rows[0]);
    }
  );
};

const createOddsRecord = (receiver, sender, challenge, channelId, callback) => {
  darbyDb.query(
    "INSERT INTO `odds_records` (`receiver_id`, `challenger_id`, `challenge`, `channel_id`, `status`) VALUES (?, ?, ?, ?, ?);",
    [receiver, sender, challenge, channelId, "open"],
    function(err, res) {
      console.log("this.sql", this.sql);

      if (err) {
        console.log(`Unable to add odds record (error: ${err})`);
        return callback(null);
      }

      console.log(`Successfully added odds record ${res.id}`);
      return callback(res);
    }
  );
};

const setOddsValue = (recordId, oddsValue, callback) => {
  darbyDb.query(
    "UPDATE `odds_records` SET `odds` = ?, `status` = ? WHERE (`id` = ?);",
    [oddsValue, "accepted", recordId],
    function(err, res) {
      console.log("this.sql", this.sql);

      if (err) {
        console.log(
          `Unable to set odds value for id ${recordID} (error: ${err})`
        );
        return callback(false);
      }

      console.log(`Successfully added odds record for id ${recordId}`);
      return callback(true);
    }
  );
};

const rejectOdds = (recordId, callback) => {
  darbyDb.query(
    "UPDATE `odds_records` SET `odds` = ?, `status` = ? WHERE (`id` = ?);",
    [0, "rejected", recordId],
    function(err, res) {
      console.log("this.sql", this.sql);

      if (err) {
        console.log(`Unable to reject odds for id ${recordID} (error: ${err})`);
        return callback(false);
      }

      console.log(`Successfully rejected odds for id ${recordId}`);
      return callback(true);
    }
  );
};

const updateChallengerPlayValue = (recordId, playValue, callback) => {
  darbyDb.query(
    "UPDATE `odds_records` SET `challenger_play_value` = ? WHERE (`id` = ?);",
    [playValue, recordId],
    function(err, res) {
      console.log("this.sql", this.sql);

      if (err) {
        console.log(
          `Unable to set the challenger play value for id ${recordID} (error: ${err})`
        );
        return callback(false);
      }

      console.log(
        `Successfully set the challenger play value for id ${recordId}`
      );
      return callback(true);
    }
  );
};

const updateReceiverPlayValue = (recordId, playValue, callback) => {
  darbyDb.query(
    "UPDATE `odds_records` SET `receiver_play_value` = ? WHERE (`id` = ?);",
    [playValue, recordId],
    function(err, res) {
      console.log("this.sql", this.sql);

      if (err) {
        console.log(
          `Unable to set the receiver play value for id ${recordID} (error: ${err})`
        );
        return callback(false);
      }

      console.log(
        `Successfully set the receiver play value for id ${recordId}`
      );
      return callback(true);
    }
  );
};

const setOddsGameStatus = (recordId, status, callback) => {
  darbyDb.query(
    "UPDATE `odds_records` SET `status` = ? WHERE (`id` = ?);",
    [status, recordId],
    function(err, res) {
      console.log("this.sql", this.sql);

      if (err) {
        console.log(`Unable to set the status for ${recordID} (error: ${err})`);
        return callback(false);
      }

      console.log(`Successfully set the status for id ${recordId}`);
      return callback(true);
    }
  );
};

module.exports = {
  addUser: addUser,
  userExists: userExists,
  getUserPoints: getUserPoints,
  setUserPoints: setUserPoints,
  getResponseToCommand: getResponseToCommand,
  addCommand: addCommand,
  usersTableFull: usersTableFull,
  fillUsersTable: fillUsersTable,
  getDmChannelForUser: getDmChannelForUser,
  getAllUserIds: getAllUserIds,
  getOpenOddsRecordsForUser: getOpenOddsRecordsForUser,
  createOddsRecord: createOddsRecord,
  setOddsValue: setOddsValue,
  rejectOdds: rejectOdds,
  getOldestPendingOddsRecordForUser: getOldestPendingOddsRecordForUser,
  updateChallengerPlayValue: updateChallengerPlayValue,
  updateReceiverPlayValue: updateReceiverPlayValue,
  setOddsGameStatus: setOddsGameStatus
};
