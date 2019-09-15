
'use strict'

const darbyDb = require('../darby_db')
const slackAction = require('../slack_action')

darbyDb.getDmChannelForUser("UMX7Q9LFP", (dmChannelId) => {
    slackAction.sendMessage("TESTING OUT TASKS", dmChannelId)
})