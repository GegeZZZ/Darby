
'use strict'

const mysql = require('mysql');

const darbyDb = mysql.createConnection(process.env.JAWSDB_URL);

darbyDb.connect();

const userExists = (userId, callback) => {
    darbyDb.query('SELECT * FROM `user_points` WHERE `user_id` = ?;',
        [userId],
        function(err, res) {
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
        function(err, rows) {
            console.log('this.sql', this.sql);
            if (err) {
                console.log(err)
                return callback(-1);
            } 

            return callback(rows[0].points);
        }
    );
}

const setUserPoints = (userId, points) => {
    darbyDb.query('UPDATE `user_points` SET `points` = ? WHERE `user_id` = ?;',
        [points, userId],
        function(err, res) {
            console.log('this.sql', this.sql);

            if (err) {
                console.log(`Unable to update points for user ${userId} (error: ${err}`)
                return;
            }

            console.log(`User ${userId} points set to ${points}`)  
        }
    );
}

const addUser = (userId, callback) => {
    darbyDb.query('INSERT INTO `user_points` (`user_id`, `points`) VALUES (?, ?);',
        [userId, 0],
        function(err, res) {
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



module.exports = {
    addUser: addUser,
    userExists: userExists,
    getUserPoints: getUserPoints,
    setUserPoints: setUserPoints
}
