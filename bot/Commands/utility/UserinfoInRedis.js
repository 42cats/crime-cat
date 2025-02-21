const { User } = require('discord.js');
class GamePlayInfo {
	constructor(guild) {
		this.guild = guild;
		this.players = new Map();
		this.isBrodcast = false;
	}
	/**
	 * 
	 * @param {User} user 
	 */
	addUser(option, user) {
		this.players.set(option, user);
		return this;
	}
	size() {
		return this.players.size;
	}
	setPlayers(users) {
		this.players = users;
		return this;
	}
	/**
	 * 
	 * @param {User} user 
	 */
	delUser(user) {
		this.players.delete(user.id);
		return this;
	}
	getUsersName() {
		let str = `${this.getGuildName()} 이 시작 되었습니다.\n`;
		this.players.forEach((v, k) => {
			console.log(v);
			str += `${k} 역 ${v.user.globalName} 님\n`;
		});
		return str;
	}
	
	togleBrodcast() {
		this.isBrodcast = !this.isBrodcast;
		return this;
	}
	getGuildName() {
		return this.guild.name;
	}
	getGuild() {
		return this.guild;
	}
	getUsers() {
		return this.players;
	}

}
module.exports = GamePlayInfo;