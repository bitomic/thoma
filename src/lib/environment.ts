import { load } from 'ts-dotenv'

export const env = load( {
	DEFAULT_LANGUAGE: {
		default: 'en-US',
		type: String
	},
	DISCORD_DEVELOPMENT_SERVER: String,
	DISCORD_OWNER: String,
	DISCORD_PREFIX: {
		optional: true,
		type: String
	},
	DISCORD_TOKEN: String,
	MYSQL_DATABASE: String,
	MYSQL_HOST: String,
	MYSQL_PASSWORD: String,
	MYSQL_PORT: {
		default: 3306,
		type: Number
	},
	MYSQL_USERNAME: String,
	NODE_ENV: [
		'development' as const,
		'production' as const
	],
	REDIS_DB: Number,
	REDIS_HOST: String,
	REDIS_PASSWORD: String,
	REDIS_PORT: Number,
	REDIS_USERNAME: String
} )
