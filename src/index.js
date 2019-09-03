
'use strict'

const bodyParser = require('body-parser')
const express = require('express')
const proxy = require('express-http-proxy')
const config = require('./config')
const request = require('request')

let bot = require('./bot')
let app = express()

if (config('PROXY_URI')) {
  app.use(proxy(config('PROXY_URI'), {
    forwardPath: (req, res) => { return require('url').parse(req.url).path }
  }))
}

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => { res.send('\n Nothing to see here, folks. \n') })

app.post('/listeners/messages', (req, res) => {
  let payload = req.body

  const message = payload.event.text
  
  if (payload.event.bot_id == null && message === message.toUpperCase()) {
    bot.send_message('I HEAR YOU', payload.event.channel)
  }

  res.status(200).send({challenge: payload.challenge})
  return
})

app.listen(config('PORT'), (err) => {
  if (err) throw err

  console.log(`\nDarby on PORT ${config('PORT')}`)
})