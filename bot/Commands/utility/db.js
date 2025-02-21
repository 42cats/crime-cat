// db.js
const { DataTypes, Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();
const sequelize = new Sequelize(process.env.DB_DISCORD, process.env.DB_USER, process.env.DB_PASS, {
	host: 'db',
	dialect: 'mysql',
	logging: false, // 필요 시 true로 변경
});

const User = sequelize.define('User', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		comment: '내부 고유 식별자',
	},
	user_id: {
		type: DataTypes.STRING(50),
		allowNull: false,
		unique: true,
		comment: '문자열 형태의 사용자 ID',
	},
	name: {
		type: DataTypes.STRING(100),
		allowNull: true,
		comment: '사용자 이름',
	},
	auth_token: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: '2FA 인증토큰 등',
	},
	point: {
		type: DataTypes.INTEGER,
		defaultValue: 0,
		comment: '사용자 포인트',
	},
	grade: {
		type: DataTypes.BIGINT,
		defaultValue: 0,
		comment: '사용자 등급',
	},
	last_play_date: {
		type: DataTypes.DATE,
		allowNull: true,
		comment: '마지막 플레이 시간',
	},
	last_online: {
		type: DataTypes.DATE,
		allowNull: true,
		comment: '마지막 접속 시간',
	},
	created_at: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW,
		comment: '계정 생성 시간',
	},
	alert_ok: {
		type: DataTypes.TINYINT,
		allowNull: false,
		defaultValue: 0,
		comment: '알림 설정 (0=해제, 1=설정)',
	},
	email: {
		type: DataTypes.STRING(255),
		allowNull: true,
		unique: true,
		comment: '이메일',
	},
	password: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: '비밀번호 (해싱된 값)',
	},
	provider: {
		type: DataTypes.ENUM('discord', 'onsite'),
		allowNull: false,
		defaultValue: 'discord',
		comment: '가입 경로 (discord 또는 onsite)',
	},
}, {
	tableName: 'users',
	timestamps: true, // createdAt, updatedAt 자동 관리
	createdAt: 'created_at',
	updatedAt: false, // `updated_at` 컬럼 없음
});

module.exports = User;



const GradeCode = sequelize.define('grade_code', {
	code: {
		type: DataTypes.CHAR(12),
		allowNull: false,
		comment: '랜덤 생성된 12자리 코드'
	},
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		comment: '내부 고유 식별자'
	},
	price: {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 500,
		comment: '포인트 가격'
	},
	created_at: {
		type: DataTypes.DATE,
		allowNull: false,
		defaultValue: DataTypes.NOW,
		comment: '생성 날짜'
	},
	is_used: {
		type: DataTypes.DATE,
		allowNull: true,
		defaultValue: null,
		comment: '사용 여부'
	},
	user_id: {
		type: DataTypes.CHAR(50),
		allowNull: true,
		defaultValue: null,
		comment: "user id"
	}
}, {
	tableName: 'grade_code',
	timestamps: false,
	comment: '그레이드코드 테이블'
});


/**
 * guild 테이블
 *  - id: 내부 auto increment PK
 *  - guild_id: VARCHAR(50)
 *  - owner_id: users.user_id (FK)
 *  - guild_name: 길드 이름
 *  - guild_onwer_name: 길드 오너이름
 */
const Guild = sequelize.define('Guild', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		comment: '내부 고유 식별자',
	},
	guild_id: {
		type: DataTypes.STRING(50),
		allowNull: false,
		unique: true,
		comment: '문자열 형태의 길드 ID',
	},
	owner_id: {
		type: DataTypes.STRING(50),
		allowNull: false,
		comment: '길드 소유자(문자열 user_id)',
	},
	guild_name: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: '길드 이름',
	},
	guild_owner_name: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: '길드 오너 표시용 이름',
	},
	last_play_date: {
		type: DataTypes.DATE,
		allowNull: true,
		comment: '길드의 마지막 플레이 시간',
	},
	head_title: {
		type: DataTypes.STRING(10),
		defaultValue: null,
		comment: '관전 역할'
	},
	observer: {
		type: DataTypes.STRING(50),
		defaultValue: null,
		comment: '관전 역할'
	},
	created_at: {
		type: DataTypes.DATE,
		allowNull: false,
		comment: '길드 생성 시간',
	},
}, {
	tableName: 'guild',
	timestamps: false,
});
/**
 * user_url 테이블
 *  - owner_id -> users.user_id
 */
const UserURL = sequelize.define('UserURL', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		comment: 'URL 고유 식별자',
	},
	owner_id: {
		type: DataTypes.STRING(50),
		allowNull: false,
		comment: '사용자 ID(문자열)',
	},
	url: {
		type: DataTypes.STRING(2048),
		allowNull: false,
		comment: 'URL 주소',
	},
	title: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: 'URL 제목',
	},
	thumbnail: {
		type: DataTypes.STRING(2048),
		allowNull: true,
		comment: 'URL 섬네일',
	},
	duration: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: '재생 시간',
	},
	created_at: {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW,
		comment: 'URL 등록 시간',
	},
}, {
	tableName: 'user_url',
	timestamps: false,
});

/**
 * guild_url 테이블
 *  - owner_id -> guild.guild_id
 */
const GuildURL = sequelize.define('GuildURL', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		comment: 'URL 고유 식별자',
	},
	owner_id: {
		type: DataTypes.STRING(50),
		allowNull: false,
		comment: '길드 ID(문자열)',
	},
	url: {
		type: DataTypes.STRING(2048),
		allowNull: false,
		comment: 'URL 주소',
	},
	title: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: 'URL 제목',
	},
	thumbnail: {
		type: DataTypes.STRING(2048),
		allowNull: true,
		comment: 'URL 섬네일',
	},
	duration: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: '재생 시간',
	},
	created_at: {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW,
		comment: 'URL 등록 시간',
	},
}, {
	tableName: 'guild_url',
	timestamps: false,
});

/**
 * history 테이블
 *  - user_id -> users.user_id
 *  - guild_id -> guild.guild_id
 */
const History = sequelize.define('History', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		comment: '기록 고유 식별자',
	},
	user_id: {
		type: DataTypes.STRING(50),
		allowNull: false,
		comment: '문자열 사용자 ID',
	},
	guild_id: {
		type: DataTypes.STRING(50),
		allowNull: true,
		comment: '문자열 길드 ID',
	},
	is_win: {
		type: DataTypes.BOOLEAN,
		defaultValue: false,
		allowNull: false,
		comment: '승리 여부',
	},
	created_at: {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW,
		comment: '기록 생성 시간',
	},
}, {
	tableName: 'history',
	timestamps: false,
});

/**
 * clean 테이블
 *  - guild_id -> guild.guild_id
 *  - channel_id: 문자열
 *  - name: 새로 추가된 열
 */
const Clean = sequelize.define('Clean', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		comment: 'clean 테이블 고유 식별자',
	},
	guild_id: {
		type: DataTypes.STRING(50),
		allowNull: false,
		comment: '문자열 길드 ID',
	},
	channel_id: {
		type: DataTypes.STRING(50),
		allowNull: false,
		unique: true,
		comment: '채널 ID(문자열)',
	},
	name: {
		type: DataTypes.STRING(255),
		allowNull: true,
		comment: '클린 기능에 사용할 별칭/이름',
	},
	created_at: {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW,
		comment: '생성 시각',
	},
}, {
	tableName: 'clean',
	timestamps: false,
});

/**
 * characters 테이블
 *  - guild_id -> guild.guild_id
 */
const Characters = sequelize.define('Characters', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		comment: 'Characters 테이블 고유 식별자',
	},
	guild_id: {
		type: DataTypes.STRING(50),
		allowNull: false,
		comment: '문자열 길드 ID',
	},
	character_name: {
		type: DataTypes.STRING(50),
		allowNull: false,
		unique: true,
		comment: '캐릭터 이름',
	},
	role_id: {
		type: DataTypes.STRING(50),
		allowNull: true,
		comment: '캐릭터 롤(문자열)',
	},
	created_at: {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW,
		comment: '생성 시각',
	},
}, {
	tableName: 'characters',
	timestamps: false,
});

/**
 * record 테이블
 *  - guild_id -> guild.guild_id
 */
const Record = sequelize.define('Record', {
	id: {
		type: DataTypes.INTEGER,
		autoIncrement: true,
		primaryKey: true,
		comment: 'record 테이블 고유 식별자',
	},
	guild_id: {
		type: DataTypes.STRING(50),
		allowNull: false,
		comment: '문자열 길드 ID',
	},
	msg: {
		type: DataTypes.STRING(5000),
		allowNull: true,
		comment: '메시지 내용(최대 5000자)',
	},
	channel_id: {
		type: DataTypes.STRING(50),
		allowNull: true,
		comment: '채널 ID(문자열)',
	},
	created_at: {
		type: DataTypes.DATE,
		defaultValue: DataTypes.NOW,
		comment: '생성 시각',
	},
}, {
	tableName: 'record',
	timestamps: false,
});

// === 관계 설정 ===
// Guild.owner_id -> User.user_id (문자열 FK)
Guild.belongsTo(User, { foreignKey: 'owner_id', targetKey: 'user_id' });

// History.user_id -> User.user_id
History.belongsTo(User, { foreignKey: 'user_id', targetKey: 'user_id' });
// History.guild_id -> Guild.guild_id
History.belongsTo(Guild, { foreignKey: 'guild_id', targetKey: 'guild_id' });

// UserURL.owner_id -> User.user_id
UserURL.belongsTo(User, { foreignKey: 'owner_id', targetKey: 'user_id' });
// GuildURL.owner_id -> Guild.guild_id
GuildURL.belongsTo(Guild, { foreignKey: 'owner_id', targetKey: 'guild_id' });

// clean.guild_id -> Guild.guild_id
Clean.belongsTo(Guild, { foreignKey: 'guild_id', targetKey: 'guild_id' });
// record.guild_id -> Guild.guild_id
Record.belongsTo(Guild, { foreignKey: 'guild_id', targetKey: 'guild_id' });
// characters.guild_id -> Guild.guild_id
Characters.belongsTo(Guild, { foreignKey: 'guild_id', targetKey: 'guild_id' });

module.exports = {
	sequelize,
	User,
	Guild,
	UserURL,
	GuildURL,
	History,
	Clean,
	Record,
	Characters,
	GradeCode,
};
