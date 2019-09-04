
'use strict'

const bodyParser = require('body-parser')
const storage = require('node-persist');
const express = require('express')
const proxy = require('express-http-proxy')
const config = require('./config')
const bot = require('./bot')

//Express
let app = express()

if (config('PROXY_URI')) {
  app.use(proxy(config('PROXY_URI'), {
    forwardPath: (req, res) => { return require('url').parse(req.url).path }
  }))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Datastore
const STORAGE_DIRECTORY = '.node-persist/storage'
storage.init({dir: STORAGE_DIRECTORY}).then(() => {
  console.log(`Storage set up at directory ${STORAGE_DIRECTORY}`)
});

// Endpoints
app.get('/', (req, res) => { res.send('\n Nothing to see here, folks. \n') })

app.post('/listeners/messages', (req, res) => {
  let payload = req.body

  if (payload.event) {
    bot.respond_to_event(payload.event, storage)
  }

  res.status(200).send({challenge: payload.challenge})
  return
})

app.listen(config('PORT'), (err) => {
  if (err) throw err

  console.log(`\nDarby on PORT ${config('PORT')}`)
})