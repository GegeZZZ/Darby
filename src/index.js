
'use strict'

const bodyParser = require('body-parser')
const express = require('express')
const proxy = require('express-http-proxy')
const redis = require('redis');
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

// Redis
const client = redis.createClient(config('REDIS_URL'));

console.log('Creating redis client...')

client.on('connect', function() {
    console.log('Redis client connected');
});

client.on('error', function (err) {
    console.log('Redis error: ' + err);
});

// Endpoints
app.get('/', (req, res) => { res.send('\n Nothing to see here, folks. \n') })

app.post('/listeners/messages', (req, res) => {
  let payload = req.body

  if (payload.event) {
    bot.respond_to_event(payload.event, client)
  }

  res.status(200).send({challenge: payload.challenge})
  return
})

app.listen(config('PORT'), (err) => {
  if (err) throw err

  console.log(`\nDarby on PORT ${config('PORT')}`)
})