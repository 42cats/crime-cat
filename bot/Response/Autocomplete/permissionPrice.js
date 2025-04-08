const { Client, AutocompleteInteraction } = require('discord.js');
const { getUserPermissons } = require('../../Commands/api/user/user');
const { getPermissons } = require('../../Commands/api/user/permission');

module.exports = {
	name: "봇권한",
	/**
	 * @param {Client} client 
	 * @param {AutocompleteInteraction} interaction 
	 */
	execute: async (client, interaction) => {
		const focusedOption = interaction.options.getFocused(true);

		if (focusedOption.name === '봇권한') {
			try {
				const userPermissions = await getUserPermissons(interaction.user.id);
				const allPermissions = await getPermissons();


				const ownedIds = new Set(userPermissions.map(p => p.permissionId));

				const missingPermissions = allPermissions.filter(
					perm => !ownedIds.has(perm.id)
				);
				const choices = missingPermissions.map(perm => ({
					name: perm.name,
					value: perm.name
				}));
				const inputValue = focusedOption.value.normalize("NFC").toLowerCase();
				const filteredChoices = choices
				.filter(permission => 
					permission.name.normalize("NFC").toLowerCase().includes(inputValue)
				)
				.slice(0, 25);

				await interaction.respond(filteredChoices);
			} catch (error) {
				console.error('봇권한 자동완성 오류:', error);
			}
		}
	}
};
