
'use strict'

const bodyParser = require('body-parser')
const express = require('express')
const proxy = require('express-http-proxy')
const config = require('./config')
const darby = require('./darby')

//Express
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