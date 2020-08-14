const slackAction = require("./slack_action");

const PROMPTS_AND_RESPONSES = {
    "hey darby, how did it all start?": "I will post a video here."
}

function respondToEndOfYearVideo(text, channel) {
    const lowerText = text.toLowerCase()

    if (lowerText in PROMPTS_AND_RESPONSES) {
        slackAction.sendMessage(PROMPTS_AND_RESPONSES[lowerText], channel)
    }
}

module.exports = {
    respondToEndOfYearVideo: respondToEndOfYearVideo,
};
