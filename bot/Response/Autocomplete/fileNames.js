const { Client, AutocompleteInteraction } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
	name: "파일이름_삭제",
	/**
	 * @param {Client} client 
	 * @param {AutocompleteInteraction} interaction 
	 * @returns 
	 */
	execute: async (client, interaction) => {
		// console.log("autocomplete access ");
        const focusedValue = interaction.options.getFocused(true);
		if(focusedValue.name === '파일이름_삭제'){
			const userDirectory = path.join(__dirname, '../../MusicData', interaction.user.id);
			
			let fileNames = [];
			if (fs.existsSync(userDirectory)) {
				fileNames = fs.readdirSync(userDirectory);
			}
			// console.log("파일목록 ,", fileNames, userDirectory);
			const suggestions = fileNames.map(file => ({ name: file, value: file }));
			await interaction.respond(suggestions);
		}
    },
};
   
	