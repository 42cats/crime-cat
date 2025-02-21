const { ActionRowBuilder, ButtonBuilder } = require('discord.js');

class ButtonsBuilder {
	constructor() {
		this.buttonArray = [];
	}

	add(...buttons) {
		const normalizedButtons = buttons.flat(); // 중첩 배열도 평탄화

		// 모든 요소가 ButtonBuilder인지 확인
		if (!normalizedButtons.every(button => button instanceof ButtonBuilder)) {
			throw new Error("버튼이 아닙니다");
		}

		// 버튼 추가
		this.buttonArray.push(...normalizedButtons);
		return this;
	}

	make() {
		const retArray = []; // 최종 결과 배열
		let tempRow = new ActionRowBuilder(); // 현재 작업 중인 ActionRowBuilder

		this.buttonArray.forEach((button, index) => {
			tempRow.addComponents(button); // 버튼 추가

			// 5개가 되거나 마지막 버튼이면 ActionRowBuilder를 retArray에 추가
			if ((index + 1) % 5 === 0 || index === this.buttonArray.length - 1) {
				retArray.push(tempRow);
				tempRow = new ActionRowBuilder(); // 새로운 ActionRowBuilder 초기화
			}
		});

		return retArray;
	}
}

module.exports = ButtonsBuilder;
