
'use strict'

const _ = require('lodash')
const mysql = require('mysql');

const darbyDb = mysql.createConnection(process.env.JAWSDB_URL);

darbyDb.connect();

const userExists = (userId, callback) => {
  darbyDb.query('SELECT * FROM `user_points` WHERE `user_id` = ?;',
    [userId],
    function (err, res) {
      console.log('this.sql', this.sql);
      if (err) {
        console.log(err)
        return callback(false);
      }

      return callback(res.length > 0);
    }
  );
}

const getUserPoints = (userId, callback) => {
  darbyDb.query('SELECT `points` FROM `user_points` WHERE `user_id` = ?;',
    [userId],
    function (err, rows) {
      console.log('this.sql', this.sql);
      if (err) {
        console.log(err)
        return callback(null);
      }

      return callback(rows[0].points);
    }
  );
}

const setUserPoints = (userId, points, callback) => {
  darbyDb.query('UPDATE `user_points` SET `points` = ? WHERE `user_id` = ?;',
    [points, userId],
    function (err, res) {
      console.log('this.sql', this.sql);

      if (err) {
        console.log(`Unable to update points for user ${userId} (error: ${err}`)
        return callback(false)
      }

      console.log(`User ${userId} points set to ${points}`)
      return callback(true, points)
    }
  );
}

const addUser = (userId, callback) => {
  darbyDb.query('INSERT INTO `user_points` (`user_id`, `points`) VALUES (?, ?);',
    [userId, 0],
    function (err, res) {
      console.log('this.sql', this.sql);

      if (err) {
        console.log(`Unable to add user ${userId} (error: ${err})`)
        return callback(false)
      }

      console.log(`Successfully added user ${userId}`)
      return callback(true)
    }
  );
}

const addCommand = (command, output, userId, callback) => {
  darbyDb.query('INSERT INTO `user_commands` (`command_name`, `command_output`, `user_id`) VALUES (?, ?, ?);',
  [command, output, userId],
  function (err, res) {
    console.log('this.sql', this.sql);

    if (err) {
      console.log(`Unable to add command ${command} (error: ${err})`)
      return callback(false)
    }

    console.log(`Successfully added command ${command} with output ${output} by user ${userId}`)
    return callback(true)
  }
);
}

const getResponseToCommand = (command, callback) => {
  darbyDb.query(
    'SELECT `command_output` FROM `user_commands` WHERE `command_name` = ?',
    [command],
    function (err, res) {
      console.log('this.sql', this.sql);

      if (err) {
        console.log(`Error selecting command ${command} (err: ${err})`)
        return callback(null)
      }
      
      if (res.length === 0){
        console.log(`No entry found for command ${command}`)
        return callback(null)
      }

      console.log(`Sucessfully found entry for command ${command}.`)
      return callback(_.sample(res).command_output)
    }
  )
}

const usersTableFull = (callback) => {
  darbyDb.query('SELECT * FROM `users`',
    [],
    function (err, res) {
      console.log('this.sql', this.sql);
      if (err) {
        console.log(err)
        return callback(false);
      }

      return callback(res.length > 0);
    }
  );
}

const fillUsersTable = (users, callback) => {
  users.forEach(user => {
    console.log(`I want to write the single piece: ${user}`)
    // Note that it would be faster to make this one call, but this should only run once ever.
    darbyDb.query('INSERT INTO `users` (`user_id`, `username`, `real_name`, `dm_channel_id`) VALUES (?, ?, ?, ?);',
      [user.id, user.name, user.real_name, user.dm_channel_id],
      function (err) {
        console.log('this.sql', this.sql);

        if (err) {
          console.log(`Unable to add user ${user} (error: ${err})`)
          return callback(false)
        }

        console.log(`Successfully added user for user Id ${user.id}`)
        return callback(true)
      }
    );
  });
}

const getDmChannelForUser = (user, callback) => {
  darbyDb.query(
    'SELECT `real_name`, `dm_channel_id` FROM `users` WHERE `user_id` = ?',
    [user],
    function (err, res) {
      console.log('this.sql', this.sql);

      if (err) {
        console.log(`Error selecting user ${user} (err: ${err})`)
        return callback()
      }
      
      if (res.length === 0){
        console.log(`No entry found for user ${user}`)
        return callback()
      }

      console.log(`Sucessfully found entry for user ${user}.`)
      return callback(res[0].dm_channel_id, res[0].real_name)
    }
  )
}

module.exports = {
  addUser: addUser,
  userExists: userExists,
  getUserPoints: getUserPoints,
  setUserPoints: setUserPoints,
  getResponseToCommand: getResponseToCommand,
  addCommand: addCommand,
  usersTableFull: usersTableFull,
  fillUsersTable: fillUsersTable,
  getDmChannelForUser: getDmChannelForUser
}
