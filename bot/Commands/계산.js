const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  Role,
} = require("discord.js");
const delayedDeleteMessage = require("./utility/deleteMsg");
const nameOfCommand = "계산";
const description = "수학 계산기 입력 예)14+(21*34) -1 /2 **2";

module.exports = {
  aliases: ["="],
  data: new SlashCommandBuilder()
    .setName(nameOfCommand)
    .setDescription(description)
    .addStringOption(
      (option) =>
        option
          .setName("계산식") // 문자열 옵션 이름
          .setDescription("입력 예)14+(21*34) -1 /2 **2") // 문자열 옵션 설명
          .setRequired(true) // 필수 옵션 여부
    ),
  async execute(interaction) {
    const expression = interaction.options.getString("계산식");
    const msg = calculateExpression(expression);
    interaction.reply(`연산 결과 ${expression} = ${msg}`);
  },
  prefixCommand: {
    name: nameOfCommand,
    description,
    async execute(message, args) {
      if (args.length === 0) {
        const msg = await message.channel.send(
          "입력 예)```!계산 14+(21*34) -1 /2 **2```"
        );
        await delayedDeleteMessage(msg, 2);
        return;
      }
      console.log("입력값 ", ...args);
      const msg = calculateExpression(...args);
      message.channel.send(`연산 결과 ${args.join("")} = ${msg}`);
    },
  },
  upload: true,
  permissionLevel: PermissionFlagsBits.DeafenMembers,
};

function calculateExpression(expression) {
  console.log("입력값 ", expression);
  // 우선순위 높은 연산부터 처리하기 위한 연산자 순서
  const operators = [
    { regex: /\*\*/g, precedence: 3, operation: (a, b) => Math.pow(a, b) },
    {
      regex: /[*\/]/g,
      precedence: 2,
      operation: (a, b, op) => (op === "*" ? a * b : a / b),
    },
    {
      regex: /[+\-]/g,
      precedence: 1,
      operation: (a, b, op) => (op === "+" ? a + b : a - b),
    },
  ];

  // 문자열을 숫자와 연산자로 분리하는 정규식
  const tokenize = (input) => {
    const tokens = [];
    const regex = /(\d+(\.\d+)?|[+\-*/()])/g;
    let match;
    while ((match = regex.exec(input)) !== null) {
      tokens.push(match[0]);
    }
    return tokens;
  };

  const processTokens = (tokens) => {
    // 괄호 처리
    while (tokens.includes("(")) {
      let start = tokens.lastIndexOf("(");
      let end = tokens.indexOf(")", start);
      if (end === -1) throw new Error("괄호및 연산 형식이 맞지 않습니다");
      const subExpression = tokens.slice(start + 1, end);
      const result = processTokens(subExpression);
      tokens.splice(start, end - start + 1, result);
    }

    // 연산자 우선순위대로 계산
    for (const { regex, operation } of operators) {
      let i = 0;
      while (i < tokens.length) {
        if (typeof tokens[i] === "string" && regex.test(tokens[i])) {
          const op = tokens[i];
          const left = parseFloat(tokens[i - 1]);
          const right = parseFloat(tokens[i + 1]);
          if (isNaN(left) || isNaN(right))
            throw new Error("인식 불가능한 표현식이 있습니다");
          const result = operation(left, right, op);
          tokens.splice(i - 1, 3, result);
          i = i - 1; // Step back to check again after replacement
        } else {
          i++;
        }
      }
    }
    if (tokens.length !== 1)
      throw new Error("인식 불가능한 표현식이 있습니다.");
    return tokens[0];
  };

  try {
    const tokens = tokenize(expression.replace(/\s+/g, "")); // Tokenize and remove whitespace
    return processTokens(tokens);
  } catch (error) {
    return `Error: ${error.message}`;
  }
}
