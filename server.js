const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const config = require('./config.json');

(function serve() {	
	if (config !== undefined) {
		var { token, whitelist, processTimeout } = config;
	} else {
		console.log('Unable to open the configuration file. Is config.json present?');
	}
	processTimeout = !isNaN(processTimeout) ? parseInt(processTimeout) : null; 
	var bot = new TelegramBot(token, {
		polling: true
	});
	
	console.log(`Server Ready, Let's go!`);
	
	bot.on('text', function(msg) {
		const { first_name, last_name, id} = msg.chat;
		const isAuthorized = whitelist.indexOf(id) > -1;
		const replyToSender = bot.sendMessage.bind(this, id);
		console.log(`${isAuthorized ? 'Running authorized' : 'Unauthorized'} command from user ${first_name} ${last_name} (${id}) [${new Date()}]: ${msg.text}`);
		
		if (!isAuthorized) {
			bot.sendMessage(id, '*You are unauthorized. This incident will be reported.*', {
				parse_mode: 'Markdown'
			});
			whitelist.forEach(user => bot.sendMessage(user, `Unauthorized Access Attempt [${new Date()}]: ${JSON.stringify(msg)}`))
		} else {
			const exec = require('child_process').exec;
			child = exec(msg.text);
			var timer;
			if (processTimeout) {
				timer = setProcessTimer(child, replyToSender, msg.text, processTimeout);
			}
			child.stdout.on('data', data => {
				if (timer !== undefined) {
					clearTimeout(timer);
					timer = setProcessTimer(child, replyToSender, msg.text, processTimeout);
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
	const id =setTimeout(f => {
		if (!child.killed) {
			replyToSender(`*Killing process '${processName}' after ${duration}ms of inactivity*`, { parse_mode: 'Markdown'})
			child.kill()
		}
	}, duration);
	return id;
};