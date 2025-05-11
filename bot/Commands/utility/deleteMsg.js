async function delayedDeleteMessage(message, delay) {
	if (!message) {
		console.error("유효하지 않은 메시지 객체입니다.");
		return;
	}
	if (message.flags?.has('Ephemeral')) {
		console.log("Ephemeral 메시지는 삭제할 수 없습니다.");
		return;
	}
	if (message.constructor.name === 'InteractionResponse' || message.constructor.name === 'ChatInputCommandInteraction') {
		console.log("InteractionResponse 또는 ChatInputCommandInteraction 객체 발견");
		message = await message.interaction.fetchReply();
	}
	setTimeout(() => {
		// 시스템 메시지 확인 추가
		if (message.deletable && !message.system) {
			message.delete()
				.then(() => console.log("메시지가 성공적으로 삭제되었습니다."))
				.catch(error => {
					const errorMessage =
						error.code === 50013
							? "메시지를 삭제할 권한이 없습니다."
							: `메시지를 삭제하는 도중 오류가 발생했습니다: ${error.message}`;
					console.log(errorMessage);
					// .catch(() => console.error("오류 메시지를 전송할 수 없습니다."));
				});
		} else {
			console.log("시스템 메시지이거나 삭제할 수 없는 메시지입니다.");
		}
	}, delay * 1000);
}

module.exports = delayedDeleteMessage;
