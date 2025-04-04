const { PermissionFlagsBits, Client, ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { decodeFromString,encodeToString } = require('../../Commands/utility/delimiterGeter');

module.exports = {
    name: "endVote",
    /**
     * 
     * @param {Client} client 
     * @param {ButtonInteraction} interaction 
     * @returns 
     */
    async execute(client, interaction) {
        const { guild, member, customId } = interaction;
        console.log("custom_id", customId);
        const { head: user_Id } = decodeFromString(customId);

        // 권한 확인
        if (!member.permissions.has(PermissionFlagsBits.Administrator) &&
            guild.ownerId !== member.id) {
            return interaction.reply({
                content: "❌ 투표 종료 권한이 없습니다.",
                ephemeral: true
            });
        }

        // 투표 데이터 가져오기
        const votes = client.voteStorage.get(guild.id) || new Map();
        if (votes.size === 0) {
            return interaction.reply({
                content: "⚠️ 기록된 투표가 없습니다.",
                ephemeral: true
            });
        }

        try {
            // 유저 정보 매핑
            const userIds = Array.from(votes.keys());
            const members = await guild.members.fetch({ user: userIds });
            const userMap = new Map(
                members.map(m => [m.id, m.displayName || m.user.username])
            );

            // 결과 집계 (캐릭터별 [투표자 목록])
            const tally = new Map();
            votes.forEach((char, userId) => {
                if (!tally.has(char)) tally.set(char, []);
                tally.get(char).push(userId);
            });

            // 결과 메시지 생성
            let resultMsg = "";
            const sortedResults = Array.from(tally.entries())
                .sort((a, b) => b[1].length - a[1].length);

            for (const [character, voters] of sortedResults) {
                const voterNames = voters
                    .map(id => userMap.get(id) || "(알수없음)")
                    .join(", ");

                resultMsg += `**${character}** (${voters.length}표)\n`;
                resultMsg += `> 투표자: ${voterNames}\n\n`;
            }
            resultMsg += "투표가 동점이라면 다시 진행하세요 아래 버튼을 누르지 않는이상 관전 권한은 부여되지 않습니다.";
            // 관전 역할 부여 버튼 추가
            const observerButton = new ButtonBuilder()
                .setCustomId(encodeToString(guild.id, "assignObserver"))
                .setLabel("관전자 역할 부여")
                .setStyle(ButtonStyle.Primary);

            const actionRow = new ActionRowBuilder().addComponents(observerButton);

            // 종료를 누른 유저에게 전송
            const owner = await client.users.fetch(user_Id);
            await owner.send({
                content: `📊 **${guild.name}** 투표 결과:\n\n${resultMsg}`,
                components: [actionRow] // 버튼 포함
            });

            // 버튼 비활성화 (투표 종료 UI)
            const disabledComponents = interaction.message.components
                .map(row => {
                    const newRow = row.toJSON();
                    newRow.components.forEach(btn => btn.disabled = true);
                    return newRow;
                });

            await interaction.update({ components: disabledComponents });

            await interaction.followUp({
                content: "✅ 투표가 종료되었습니다! 결과가 DM으로 전송되었습니다.",
                ephemeral: true
            });

        } catch (error) {
            console.error("투표 종료 오류:", error);
            await interaction.reply({
                content: "⚠️ 결과 처리 중 오류가 발생했습니다.",
                ephemeral: true
            });
        }
    }
};
