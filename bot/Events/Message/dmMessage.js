const { Client, Message } = require('discord.js');
const dotenv = require('dotenv');
dotenv.config();

module.exports = {
	name: "dmMessage",
	/**
	 * 
	 * @param {Client} client 
	 * @param {Message} message
	 */
	execute: async (client, message) => {
		console.log(`DM received from ${message.author.tag}: ${message.content}`);
		await message.channel.send('DM을 관리자에게 전송하였습니다. 답변을 기다려 주세요!');
		client.replyUserDm = message.channel;
		const master = client.master;
		master.send(`${message.author.id}`);
		master.send(`${message.author.tag}: ${message.content}`);
	},
}