import { load } from 'ts-dotenv'
import path from 'path'

export const env = load( {
	DISCORD_DEVELOPMENT_SERVER: {
		optional: true,
		type: String
	},
	DISCORD_OWNER: String,
	DISCORD_PREFIX: {
		optional: true,
		type: String
	},
	DISCORD_TOKEN: String,
	GITHUB_PAT: String,
	NODE_ENV: [
		'development' as const,
		'production' as const
	],
	SQLITE_PATH: {
		default: path.resolve( __dirname, '../../databases/discord.sqlite' ),
		type: String
	}
} )
