'use strict';

const TelegramBot = require('node-telegram-bot-api');
let config;
try {
	config = require('./config.json');
} catch (e) {
	throw new Error('Unable to open the configuration file. Is config.json present?');
}


(function serve() {	
	config.processTimeout = !isNaN(config.processTimeout) ? parseInt(config.processTimeout) : null; 
	var bot = new TelegramBot(config.token, {
		polling: true
	});
	
	console.log(`Server Ready, Let's go!`);
	
	bot.on('text', function(msg) {
		const first_name = msg.chat.first_name;
		const last_name = msg.chat.last_name;
		const id = msg.chat.id;
		const isAuthorized = config.whitelist.indexOf(id) > -1;
		const replyToSender = bot.sendMessage.bind(this, id);
		console.log(`${isAuthorized ? 'Running authorized' : 'Unauthorized'} command from user ${first_name} ${last_name} (${id}) [${new Date()}]: ${msg.text}`);
		
		if (!isAuthorized) {
			bot.sendMessage(id, '*You are unauthorized. This incident will be reported.*', {
				parse_mode: 'Markdown'
			});
			
			// send a message to all whitelisted users regarding unauthorized attempt
			config.whitelist.forEach(user => bot.sendMessage(user, `Unauthorized Access Attempt [${new Date()}]: ${JSON.stringify(msg)}`))
		} else {
			const exec = require('child_process').exec;
			const child = exec(msg.text);
			var timer;
			if (config.processTimeout) {
				timer = setProcessTimer(child, replyToSender, msg.text, config.processTimeout);
			}
			child.stdout.on('data', data => {
				if (timer !== undefined) {
					clearTimeout(timer);
					timer = setProcessTimer(child, replyToSender, msg.text, config.processTimeout);
				}
				bot.sendMessage(id, `${data}`)
					.catch(err => bot.sendMessage(id, err.message))
			});

			child.stderr.on('data', data => {
				bot.sendMessage(id, `*Error: ${data}*`, { parse_mode: 'Markdown'});
				bot.sendMessage(id, `*Killing Process*`, { parse_mode: 'Markdown'});
				child.stdin.pause();
				child.kill();
			});

			child.on('close', code => {
				clearTimeout(timer)
				bot.sendMessage(id, `*Process exited with code ${code}*`, { parse_mode: 'Markdown'});
			});
		}
	});
})();

function setProcessTimer(child, replyToSender, processName, duration) {
	const id = setTimeout(() => {
		if (!child.killed) {
			replyToSender(`*Killing process '${processName}' after ${duration}ms of inactivity*`, { parse_mode: 'Markdown'})
			child.kill()
		}
	}, duration);
	return id;
};
