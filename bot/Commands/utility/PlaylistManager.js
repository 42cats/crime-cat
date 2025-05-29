// PlaylistManager.js
const fs = require('fs');
const path = require('path');
const { getGuildMusic } = require('../api/guild/music');
/**
 * 플레이리스트 관리 전담 클래스
 * (정렬, 페이징, 데이터 로드, 셔플 등)
 */
const REPEATONE = 0;
const NOMAL = 1;
const ONCE = 2;
const SHUFFLE = 3;
const ABC = 4;
const DATE = 5;

class PlaylistManager {
	constructor(parent, pageSize = 15) {
		this.parent = parent;
		this.guildId = this.parent.guildId;

		// 재생 모드
		this.playMode = REPEATONE;

		// 정렬 상태
		this.sort = DATE;

		// 재생 목록과 셔플 인덱스
		this.playlist = [];
		this.shuffledIndices = [];

		// 현재 재생 곡 인덱스
		this.currentIndex = 0;

		// 페이지 관련
		this.pageSize = pageSize;
		this.currentPage = 0;
		this.maxPage = 0;

		// 정렬된 리스트 캐싱
		this._sortedCache = {
			[ABC]: null,
			[DATE]: null,
			lastUpdate: 0
		};

		// 페이지 캐싱
		this._pageCache = new Map();
	}
	toString() {
		return `재생모드 = ${this.playMode},\n 정렬상태 = ${this.sort}\n 재생목록 타이틀 = ${this.playlist.map(v => v.title)},\n 셔플 인덱스 어레이 = ${this.shuffledIndices},\n셔플 인덱스 길이 = ${this.shuffledIndices.length}  현재곡 인덱스 = ${this.currentIndex}`;
	}
	// 재생 모드 설명 문자열 반환 (예: "🔂 한곡반복")
	getTpyePlay() {
		switch (this.playMode) {
			case ONCE:
				return "1️⃣ 한번재생";
			case NOMAL:
				return "🔁 순차재생";
			case SHUFFLE:
				return "🔀 셔플재생";
			case REPEATONE:
				return "🔂 한곡반복";
		}
	}

	// 재생 모드 변경 (순환)
	setPlayMode() {
		this.playMode = this.playMode + 1 > 3 ? 0 : this.playMode + 1;
		if (this.playMode === SHUFFLE) {
			this.shufflePlaylist();
		}
	}

	// 정렬 아이콘 반환
	getEmoji(type) {
		switch (type) {
			case ABC:
				return "🔠";
			case DATE:
				return "📅";
			case ONCE:
				return "1️⃣";
			case NOMAL:
				return "🔁";
			case SHUFFLE:
				return "🔀";
			case REPEATONE:
				return "🔂";
		}
	}

	// 플레이리스트 로드 (DB 조회)
	async refresh() {
		// 캐시 무효화
		this._sortedCache[ABC] = null;
		this._sortedCache[DATE] = null;
		this._pageCache.clear();

		try {
			if (this.parent.local) {
				// Define the directory containing local audio files
				const localDirectory = path.join(__dirname, '../..//MusicData', this.parent.operator.id.toString());

				// Check if the directory exists
				if (!fs.existsSync(localDirectory)) {
					console.error(`Local directory not found: ${localDirectory}`);
					this.playlist = [];
					return;
				}

				// Read all files in the directory
				const files = fs.readdirSync(localDirectory);

				// Filter audio files based on allowed extensions
				const audioFiles = files.filter(file => {
					const ext = path.extname(file).toLowerCase();
					return ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.opus'].includes(ext);
				});

				// Map files to playlist entries
				this.playlist = audioFiles.map((file, i) => ({
					id: i,
					title: path.basename(file, path.extname(file)), // File name without extension
					url: path.join(localDirectory, file), // Full path to the file
					thumbnail: null, // No thumbnail for local files
					duration: null, // Duration can be set if known
					createdAt: fs.statSync(path.join(localDirectory, file)).birthtimeMs, // File creation time
				}));
			} else {
				// Fetch entries from the database
				const urls = await getGuildMusic(this.guildId);
				this.playlist = urls.map((url, i) => ({
					id: i,
					title: url.title,
					url: url.youtubeUrl,
					thumbnail: url.thumbnail,
					duration: url.duration,
					createdAt: url.createdAt,
				}));
			}

			// Calculate the maximum number of pages
			this.maxPage = Math.ceil(this.playlist.length / this.pageSize) - 1;
			
			// 캐시 유효시간 설정 (30분)
			this.cacheExpiry = Date.now() + 1800 * 1000;
		} catch (error) {
			console.error('Error refreshing playlist data:', error);
			throw new Error('An error occurred while refreshing the playlist data.');
		}
	}

	// 정렬 변경 (날짜 ↔ 알파벳)
	sortList() {
		if (this.sort === ABC) {
			// this.playlist = this.playlist.sort((a, b) => a.createdAt - b.createdAt);
			this.sort = DATE;
		} else if (this.sort === DATE) {
			// this.playlist = this.playlist.sort((a, b) => a.title.localeCompare(b.title));
			this.sort = ABC;
		}
	}

	// 셔플 실행 (Fisher-Yates 알고리즘)
	shufflePlaylist() {
		if (this.playlist.length <= 0) return;

		this.shuffledIndices = Array.from({ length: this.playlist.length }, (_, i) => i);

		// 현재 재생 중인 곡을 첫 번째로 고정
		const currentIdx = this.currentIndex;
		[this.shuffledIndices[0], this.shuffledIndices[currentIdx]] = 
			[this.shuffledIndices[currentIdx], this.shuffledIndices[0]];

		// Fisher-Yates 셔플 (더 효율적)
		for (let i = this.shuffledIndices.length - 1; i > 1; i--) {
			const j = Math.floor(Math.random() * i) + 1;
			[this.shuffledIndices[i], this.shuffledIndices[j]] = 
				[this.shuffledIndices[j], this.shuffledIndices[i]];
		}
	}

	// 현재 재생 곡 반환
	getCurrent() {
		if (this.playlist.length === 0) {
			return null;
		}
		if (this.playMode === SHUFFLE) {
			const shuffledIndex = this.shuffledIndices[this.currentIndex];
			return this.playlist[shuffledIndex];
		}
		return this.playlist[this.currentIndex];
	}

	// 인덱스로 곡 반환
	getByIndex(index) {
		// console.log("play index = ", index);
		if (index < 0 || index > this.playlist.length) {
			throw new Error('유효하지 않은 인덱스입니다.');
		}
		if (this.playMode === SHUFFLE) {
			const shuffledIndex = this.shuffledIndices[index];
			return this.playlist[shuffledIndex];
		}
		return this.playlist[index];
	}

	// 다음 곡 미리보기
	nextInfo() {
		if (this.playMode === REPEATONE)
			return this.getByIndex(this.currentIndex);
		if (this.playMode === ONCE)
			return null;
		let nextIdx = (this.currentIndex + 1) % this.playlist.length;
		return this.getByIndex(nextIdx);
	}

	// 실제 다음 곡 이동
	async next(playCallback) {
		if (!playCallback) return;
		this.currentIndex = ++this.currentIndex % this.playlist.length;
		await playCallback(this.currentIndex);
	}

	// 이전 곡 이동
	async prev(playCallback) {
		if (!playCallback) return;
		this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
		await playCallback(this.currentIndex);
	}
	hasData() {
		return this.playlist && this.playlist.length > 0;
	}

	isExpired() {
		// 캐시가 5분(300초) 이상 지났는지 확인
		return !this.cacheExpiry || Date.now() > this.cacheExpiry;
	}

	// 캐시 강제 초기화 (주소 추가/삭제 시 사용)
	invalidateCache() {
		this.cacheExpiry = null;
		this._sortedCache[ABC] = null;
		this._sortedCache[DATE] = null;
		this._pageCache.clear();
	}

	getSortedList() {
		// 캐시 확인 (30분간 유효로 변경)
		if (this._sortedCache[this.sort] && 
			Date.now() - this._sortedCache.lastUpdate < 1800000) {
			return this._sortedCache[this.sort];
		}

		// 정렬 수행 및 캐싱
		let sorted;
		if (this.sort === ABC) {
			sorted = [...this.playlist].sort((a, b) => a.title.localeCompare(b.title));
		} else if (this.sort === DATE) {
			sorted = [...this.playlist].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
		} else {
			sorted = [...this.playlist];
		}

		this._sortedCache[this.sort] = sorted;
		this._sortedCache.lastUpdate = Date.now();

		return sorted;
	}

	// 현재 페이지 계산
	getCurrentPage() {
		const cacheKey = `${this.currentPage}-${this.sort}`;

		// 페이지 캐시 확인
		if (this._pageCache.has(cacheKey)) {
			return this._pageCache.get(cacheKey);
		}

		const sorted = this.getSortedList();
		const start = this.currentPage * this.pageSize;
		const end = start + this.pageSize;
		const page = sorted.slice(start, end);

		// 캐시 저장 (최대 10페이지)
		if (this._pageCache.size > 10) {
			const firstKey = this._pageCache.keys().next().value;
			this._pageCache.delete(firstKey);
		}
		this._pageCache.set(cacheKey, page);

		return page;
	}


	nextPage() {
		if (this.currentPage < this.maxPage) {
			this.currentPage++;
		} else {
			throw Error('다음 페이지가 없습니다.');
		}
	}

	prevPage() {
		if (this.currentPage > 0) {
			this.currentPage--;
		} else {
			throw Error('이전 페이지가 없습니다.');
		}
	}

	// 모든 리소스 정리
	destroy() {
		// 캐시 정리
		this._sortedCache = null;
		this._pageCache?.clear();
		this._pageCache = null;

		// 배열 정리
		this.playlist = [];
		this.shuffledIndices = [];
		this.currentIndex = 0;
		this.currentPage = 0;
		this.maxPage = 0;

		// 참조 해제
		this.parent = null;

		console.log('PlaylistManager 리소스 정리 완료.');
	}
}

module.exports = {
	PlaylistManager,
	REPEATONE,
	NOMAL,
	ONCE,
	SHUFFLE,
	ABC,
	DATE
};
