
const { Client, ActivityType } = require('discord.js')
async function ActivityMessage(bot, msg, type) {
	bot.user.setActivity(msg, { type });
}

/**
 * 
 * @param {Client} client 
 * @param {*} messege 
 * @param {*} currentIndex 
 */
module.exports = (client, messege, currentIndex) => {
	setInterval(async () => {
		const ownerSet = new Set();
		messege = [];
		client.guilds.valueOf().map(v => ownerSet.add(v.ownerId));
		messege.push(`자랄떄까지 ${ownerSet.size - 1}/75`);
		messege.push(`추가수 ${client.guilds.valueOf().size - 1}/100`);
		const keys = await client.redis.keys('*');
		const gamePlayGuildList = [];
		for (const key of keys) {
			const value = await client.redis.get(key);
			if (parseInt(value) > 3)
				gamePlayGuildList.push(`Now!! ${key}`);
		}
		messege = [...messege, ...gamePlayGuildList];
		currentIndex = (currentIndex + 1) % messege.length;
		ActivityMessage(client, messege[currentIndex], currentIndex < 2 ? ActivityType.Watching : ActivityType.Playing);
	}, 6000);
}