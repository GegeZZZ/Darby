'use strict'

const slackAction = require("./slack_action");

const PROMPT_TO_RESPONSES = {
    "hey darby, how did it all start?":                             "TODO",
    "nice view!":                                                   "Yeah - Maine was awesome!",
    "btw darby, what’s your favorite food?":                        "Data :stuck_out_tongue:",
    "seriously, what actual food do you like?":                     "TODO",
    "yummy... darby what else did you do all day other than eat?":  "TODO",
    "it looks like your days weren’t sparse at all...":             "Yes! I was very busy. Class, homework, dates, friends... Plus I will post a video",
    "darby... :man-facepalming:":                                   "Sorry, wrong file!",
    "darby, i heard you are graduating today!":                     "Yes. And can I tell you a secret?",
    "sure.":                                                        "I am going to miss all my classmates a lot.",
    "thank you, darby!":                                            "Wait...",
    "what is it?":                                                  "This can't end yet...",
    "?":                                                            "Without a special performance brought to you by the MBAn class of 2020!!!"
}

const PROMPT_TO_VIDEOS = {
    "hey darby, how did it all start?":                 "TODO",
    "seriously, what actual food do you like?":         "TODO",
    "it looks like your days weren’t sparse at all...": "TODO",
    "darby... :man-facepalming:":                       "TODO",
    "sure.":                                            "TODO",
    "?":                                                "TODO"
}

function respondToEndOfYearVideo(text, channel) {
    const cleanedText = text.replace(/\s/g, ' ').toLowerCase()

    if (cleanedText in PROMPT_TO_RESPONSES) {
        slackAction.sendMessage(PROMPT_TO_RESPONSES[cleanedText], channel, false)
    }

    if (cleanedText in PROMPT_TO_VIDEOS) {
        slackAction.sendMessage(PROMPT_TO_VIDEOS[cleanedText], channel, false)
    }
}

module.exports = {
    respondToEndOfYearVideo: respondToEndOfYearVideo,
};

