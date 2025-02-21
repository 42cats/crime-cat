const { GuildURL } = require('./db');
const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
async function deleteUrlList(guildId, page) {
	if (!guildId) {
		throw Error('길드아이디 오류. 관리자에게 문의');
	}

	const pageSize = 10;

	try {
		const urls = await GuildURL.findAll({
			where: { owner_id: BigInt(guildId) },
		});

		const playlist = urls.map((url) => {
			return {
				id: url.dataValues.id,
				title: url.dataValues.title,
				url: url.dataValues.url,
				thumbnail: url.dataValues.thumbnail,
				duration: url.dataValues.duration,
				createdAt: url.dataValues.created_at.valueOf(),
			};
		});

		const maxPage = Math.ceil(playlist.length / pageSize) - 1;

		if (page > maxPage || page < 0) {
			console.log("error page!!");
			return null;
		}

		const startIndex = page * pageSize;
		const endIndex = Math.min(startIndex + pageSize, playlist.length);
		const currentPageItems = playlist.slice(startIndex, endIndex);

		const valuestr = guildId + "_deleteUrl:";
		const menuMsg = "삭제할 곡을 선택해 주세요.";

		let options = [
			{
				label: `------      Page No. ${page + 1}     ------`,
				value: valuestr + 'Page?',
			},
			{
				label: `-----      ◀️ 이전 페이지     -----`,
				value: valuestr + `prevPage?${page - 1}`,
			},
		];

		if (currentPageItems.length > 0) {
			options = [
				...options,
				...currentPageItems.map((item, index) => ({
					label: `${String(index + startIndex).padStart(2, '0')}_${item.title} ${item.duration}`,
					value: valuestr + item.title,
				})),
			];
		}

		options = [
			...options,
			{
				label: `------      Page No. ${page + 1}     ------`,
				value: valuestr + 'none?',
			},
			{
				label: `-----    ▶️ 다음 페이지    -----`,
				value: valuestr + `nextPage?${page + 1}`,
			},
		];

		const selectMenu = new StringSelectMenuBuilder()
			.setCustomId(`${guildId}_selectMenu`)
			.setPlaceholder(menuMsg)
			.addOptions(options)
			.setMinValues(1)
			.setMaxValues(options.length);
		return new ActionRowBuilder().addComponents(selectMenu);
	} catch (error) {
		console.error('Error refreshing Guild URL data:', error);
		throw new Error('Guild URL 데이터를 가져오는 중 오류가 발생했습니다.');
	}
}

module.exports = deleteUrlList;