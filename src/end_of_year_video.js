'use strict'

const slackAction = require("./slack_action");

const PROMPT_TO_RESPONSES = {
    "hey darby, how did it all start?":                             "I will post a video here.",
    "Nice view!":                                                   "Yeah - Maine was awesome!",
    "Btw Darby, what’s your favorite food?":                        "Data :stuck_out_tongue:",
    "Seriously, what actual food do you like?":                     "I will post a food video here.",
    "Yummy… Darby what else did you do all day other than eat?":    "I will post a work video here.",
    "It looks like your days weren’t sparse at all...":             "Yes! I was very busy. Class, homework, dates, friends... Plus I will post a video",
    "Darby... :man-facepalming:":                                   "Sorry, wrong file!",
    "Darby, I heard you are graduating today!":                     "Yes. And can I tell you a secret?",
    "Sure.":                                                        "I am going to miss all my classmates a lot.",
    "Thank you, Darby!":                                            "Wait...",
    "What is it?":                                                  "This can't end yet...",
    "?":                                                            "Without a special performance brought to you by MBAn!!!"
}

const PROMPT_TO_VIDEOS = {
    "hey darby, how did it all start?": "TODO",
    "Seriously, what actual food do you like?": "TODO",
    "It looks like your days weren’t sparse at all...": "TODO",
    "Darby... :man-facepalming:": "TODO",
    "Sure.": "TODO",
    "?": "TODO"
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

