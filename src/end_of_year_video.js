'use strict'

const slackAction = require("./slack_action");

const PROMPT_TO_RESPONSES = {
    "hey darby, how did it all start?": "I will post a video here."
}

function respondToEndOfYearVideo(text, channel) {
    const cleanedText = text.replace(/\s/g, ' ').toLowerCase()

    if (cleanedText in PROMPT_TO_RESPONSES) {
        slackAction.sendMessage(PROMPT_TO_RESPONSES[cleanedText], channel)
    }
}

module.exports = {
    respondToEndOfYearVideo: respondToEndOfYearVideo,
};

