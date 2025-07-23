const { SlashCommandBuilder, PermissionFlagsBits, CommandInteraction, Message } = require('discord.js');
const delayedDeleteMessage = require('./utility/deleteMsg');

const nameOfCommand = "주사위";
const description = "주사위 던지기";

module.exports = {
    aliases: ["r", "R", "ㄱ", "ㄲ"],
    data: new SlashCommandBuilder()
        .setName(nameOfCommand)
        .setDescription(description)
        .addNumberOption(option =>
            option
                .setName('눈_개수')
                .setDescription('미입력시 기본 6개')
                .setMinValue(1)
                .setRequired(false)
        )
        .addNumberOption(option =>
            option
                .setName('주사위_개수')
                .setDescription('미입력시 기본 1개')
                .setMinValue(1)
                .setRequired(false)
        ),
    /**
     * 
     * @param {CommandInteraction} interaction 
     */
    async execute(interaction) {
        const point = interaction.options.getNumber('눈_개수') || 6;
        const dice = interaction.options.getNumber('주사위_개수') || 1;
        const msg = diceSimulator(point, dice);
        await interaction.reply(`${interaction.user.displayName ?? interaction.user.globalName} 님의\n${msg}`);
    },

    prefixCommand: {
        name: nameOfCommand,
        description,
        /**
         * 
         * @param {Message} message 
         * @param {Array} args 
         */
        async execute(message, args) {
            let point = 6;
            let dice = 1;

            // 주사위 눈 파싱
            if (args.length >= 1) {
                const parsedPoint = parseInt(args[0]);
                if (!isNaN(parsedPoint) && parsedPoint > 0) {
                    point = parsedPoint;
                }
            }

            // 주사위 개수 파싱
            if (args.length >= 2) {
                const parsedDice = parseInt(args[1]);
                if (!isNaN(parsedDice) && parsedDice > 0) {
                    dice = parsedDice;
                }
            }

            const msg = diceSimulator(point, dice);
            console.log("message - ", msg);
            await message.channel.send(`${message.author.displayName ?? message.author.globalName} 님의\n${msg}`);
            delayedDeleteMessage(message);
        }
    },
    upload: true,
    permissionLevel: PermissionFlagsBits.DeafenMembers,
    
    // 다른 모듈에서 사용할 수 있도록 diceSimulator 함수 내보내기
    diceSimulator: diceSimulator
};

function diceSimulator(point, dice) {
    const results = [];
    let total = 0;

    // 주사위 롤링
    for (let i = 0; i < dice; i++) {
        const roll = Math.floor(Math.random() * point) + 1;
        results.push(roll);
        total += roll;
    }

    // 결과 문자열 생성
    let resultStr;
    if (dice === 1) {
        resultStr = `${results[0]}`;
    } else {
        resultStr = `${results.join(' + ')} = **${total}**`;
    }

    return `🎲 주사위 결과: ${resultStr} (${dice}D${point})`;
}