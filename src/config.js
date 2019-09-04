
'use strict'

const dotenv = require('dotenv')
const ENV = process.env.NODE_ENV || 'development'

if (ENV === 'development') dotenv.load()

const config = {
  ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  PROXY_URI: process.env.PROXY_URI,
  WEBHOOK_URL: process.env.WEBHOOK_URL,
  BOT_USER_TOKEN: process.env.BOT_USER_TOKEN,
  REDIS_URL: process.env.REDIS_URL
}

module.exports = (key) => {
  if (!key) return config

  return config[key]
}
