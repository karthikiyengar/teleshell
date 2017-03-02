# teleshell

Gain shell access to your machine using a Telegram Bot. 

Some cases where this might be helpful:
* You're in a double NAT environment and do not have access to your ISP's routers.
* You're behind a firewall which blocks incoming traffic.
* You have a dynamic IP address and don't want to set up Dynamic DNS

The things that you can do with teleshell would ideally be enough to get a reverse SSH tunnel going to your box, wherever you are.

## Quick Start

* Generate a telegram bot authorization token by following the instructions [here](https://core.telegram.org/bots#6-botfather)
* Rename the configuration template file (config.example.json) to config.json. Here are the properties that are supported

| Property | Type | Description |
|---|---|---|
| `token`	| String | The authorization token for your telegram bot |
| `whitelist` | Array(Number) | An array of whitelisted user ID (see below), from which commands will be run. |
| `processTimeout` | Number | Number of milliseconds after which the spawned process will be killed (Optional) |

* `npm install`
* `node server.js`
* Now go to Telegram and ping the bot that you've created. If the token has been set correctly, you should see loglines like so on your terminal: `Unauthorized command from user <NAME> (<USER ID>) [Thu Sep 08 2016 22:39:02 GMT+0530 (IST)]: ls`
* Copy the User ID and add it to the whitelist and you are done. The bot will alert you if it receives messages from non-whitelisted IDs

<p align="center">
  <img src="https://cloud.githubusercontent.com/assets/8260207/18361498/a8c23f1e-761f-11e6-91b3-b938b6118342.jpg" height="400" />
</p>

## Autostart
Using pm2, you can get teleshell to autoexecute on startup

* `npm install --global pm2`
* `sudo pm2 startup`
* `pm2 server.js --name teleshell`
* `pm2 save`

Suggestions, contributions, criticism and pull requests welcome.
