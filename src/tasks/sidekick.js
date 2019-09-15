
'use strict'

const darbyDb = require('../darby_db')
const slackAction = require('../slack_action')

darbyDb.getDmChannelForUser("UMX7Q9LFP", (dmChannelId) => {
    slackAction.sendMessage("TESTING OUT TASKS", dmChannelId)
})

// Steps for sidekicks

// 1. Get all User Ids,  names and DM channels

// 2. Copy user Ids and make pairs

// 3. DM each pair and ask them to meet up? Or make a group chat?