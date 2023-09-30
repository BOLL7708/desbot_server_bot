# Server Bot for Discord
This was made for the official desbot server, at the time of writing this code is not public, but if it becomes public, that is what this project was made for.

## Features
1. Can connect to Discord to do things
2. Can change the server icon on a schedule and post the image to a forum channel
3. Can log messages to a text channel

## How to use
1. Clone the repo
2. Run `npm install`
3. Use `config.json` or copy it to `config.local.json` if you want to update the bot in the future. Then fill in the values in it.
4. For the server icons, put an `icon.png` file in `./images` that will be used by default, all other icons in `./images/icons`.
5. Run `node index.js`