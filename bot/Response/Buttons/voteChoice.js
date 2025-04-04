// voteChoice.js (투표 처리 핸들러)
const { ButtonStyle, Client, ButtonInteraction } = require('discord.js');
const { decodeFromString } = require('../../Commands/utility/delimiterGeter');

const voteStorage = new Map(); // { guild.id: { userId: characterName } }

module.exports = {
    name: "voteChoice",
    /**
     * 
     * @param {Client} client 
     * @param {ButtonInteraction} interaction 
     */
    async execute(client, interaction) {
        const { customId, user, guild } = interaction;
        const owner = await guild.fetchOwner();
        const { head: user_id, option: character, otherOption: maxVote } = decodeFromString(customId);

        // 투표 저장 로직
        if (!client.voteStorage.has(guild.id)) client.voteStorage.set(guild.id, new Map());
        const votes = client.voteStorage.get(guild.id);
        const prevVote = votes.get(user.id);
        votes.set(user.id, character);
        console.log("interaction ", interaction.message.author);
        const commandUser = await client.users.fetch(user_id);
        commandUser.send(`${user.displayName || user.globalName} 님이 투표하셨습니다. ${votes.size}명 투표!`);
        // 응답 메시지 구성
        const reply = prevVote
            ? `✅ ${prevVote} → ${character}로 투표 변경됨`
            : `✅ ${character} 투표 완료!`;

        await interaction.reply({ content: reply, ephemeral: true });
    }
};
