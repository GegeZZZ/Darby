
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
        callback(false)
      }

      console.log(`User ${userId} points set to ${points}`)
      callback(true, points)
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
        callback(false)
      }

      console.log(`Successfully added user ${userId}`)
      callback(true)
    }
  );
}

const addCommand = (command, output, userId, callback) => {
  darbyDb.query('INSERT INTO `user_commands` (`command_name`, `command_output`, `user_id`) VALUES (?, ?, ?);',
  [command, output, user_id],
  function (err, res) {
    console.log('this.sql', this.sql);

    if (err) {
      console.log(`Unable to add command ${command} (error: ${err})`)
      callback(false)
    }

    console.log(`Successfully added command ${command} with output ${output} by user ${userId}`)
    callback(true)
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
        callback(null)
      }
      
      if (res.length === 0){
        console.log(`No entry found for command ${command}`)
        callback(null)
      }

      console.log(`Sucessfully found entry for command ${command}.`)
      callback(_.sample(res).command_output)
    }
  )
}

module.exports = {
  addUser: addUser,
  userExists: userExists,
  getUserPoints: getUserPoints,
  setUserPoints: setUserPoints,
  getResponseToCommand: getResponseToCommand
}
