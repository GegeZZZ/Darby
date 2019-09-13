
'use strict'

const bodyParser = require('body-parser')
const express = require('express')
const proxy = require('express-http-proxy')
const config = require('./config')
const darby = require('./darby')
const darbyDb = require('./darby_db')
const slackAction = require('./slack_action')

function userIsHuman(user) {
  return !user.deleted && !user.is_bot && user.name !== 'slackbot'
}

// Database
// If we don't have our users table, create it
// One tricky bit with this is we need to first get the users, then, for each user,
// get the slack channel (through slack api), and then combine those fields and 
// write them to the db. I do this in a really gross way, and I hate it. But at least it works
// If you're here to judge my code, and want to find the grossest spot, this is it.
// The good news is that it only runs once, when the app first runs
// (although it should probably run if there's a change in users)
darbyDb.usersTableFull((tableFull) => {
  if (!tableFull) {
    slackAction.getUsersList((usersData) => {
      const activeHumanUsers = usersData.filter(user => userIsHuman(user));
      let activeHumanUsersWithDm = []

      function addActiveHumanUserWithDm(activeHumanUserWithDm) {
        activeHumanUsersWithDm.push(activeHumanUserWithDm)

        if (activeHumanUsers.length === activeHumanUsersWithDm.length) {
          darbyDb.fillUsersTable(activeHumanUsersWithDm, (_success) => {})
        }
      }

      activeHumanUsers.forEach((user) => {
        slackAction.openDmWithUser(user.id, (channel) => {
          const result = {
            id: user.id,
            name: user.name,
            real_name: user.real_name,
            dm_channel_id: channel
          }

          return addActiveHumanUserWithDm(result);
        })
      })
    })
  }
})

// Express
let app = express()

if (config('PROXY_URI')) {
  app.use(proxy(config('PROXY_URI'), {
    forwardPath: (req, res) => { return require('url').parse(req.url).path }
  }))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Endpoints
app.get('/', (req, res) => { res.send('\n Nothing to see here, folks. \n') })

app.post('/listeners/messages', (req, res) => {
  let payload = req.body

  if (payload.event) {
    darby.respond_to_event(payload.event)
  }

  res.status(200).send({challenge: payload.challenge})
  return
})

app.listen(config('PORT'), (err) => {
  if (err) throw err

  console.log(`\nDarby on PORT ${config('PORT')}`)
})