# Darby
Darby Charlesworth the Second is the least helpful Slackbot around.

Here is a photo of Darby:

![Darby](images/darby_the_second.jpeg)

## Quick start guide

You should be able to clone this and run `npm start`. You may need to create an `.env` file. Please see the `.env-example` to see what should be in the `.env`.

## What can Darby do
1. Darby can answer to you when you talk in ALL CAPS
2. Darby can assign points to people (++ @person) and take them away (-- @person)
3. Darby can learn things. Tell him `!prompt multi word response` and then ask him `?prompt`
4. Darby can dm you. Simply say (anywhere) `dm me`
5. Darby can encourage you! Simply say `help me` or `encourage me`
6. Darby can send you quotes from Prof. Bertsimas `db quote`
7. Darby can facilitate a game of odds! `$odds @person go eat a banana` to start.

## TODO

* Get linter
* Catch more errors
* Add birthday messages
* Add better request authentication
* Let Darby keep track of bets
* Add quotes per person that people can add onto 
* Make Darby give points in threads, not in channel
* Make Darby's answers use GPT2