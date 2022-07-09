import { container, LogLevel, SapphireClient } from '@sapphire/framework'
import { Intents, Options } from 'discord.js'
import { env } from './environment'
import { ModelStore } from '../framework'
import { Octokit } from '@octokit/core'
import type { Sequelize } from 'sequelize'
import { sequelize } from './Sequelize'

export class UserClient extends SapphireClient {
	public constructor() {
		super( {
			defaultPrefix: env.DISCORD_PREFIX ?? '!',
			intents: [
				Intents.FLAGS.GUILDS,
				Intents.FLAGS.GUILD_MESSAGES
			],
			loadDefaultErrorListeners: true,
			logger: {
				level: LogLevel.Debug
			},
			makeCache: Options.cacheWithLimits( {
				BaseGuildEmojiManager: 0,
				GuildBanManager: 0,
				GuildEmojiManager: 0,
				GuildInviteManager: 0,
				GuildMemberManager: 25,
				GuildScheduledEventManager: 0,
				GuildStickerManager: 0,
				MessageManager: 100,
				PresenceManager: 0,
				ReactionManager: 0,
				ReactionUserManager: 0,
				StageInstanceManager: 0,
				ThreadManager: 25,
				ThreadMemberManager: 0,
				UserManager: 50,
				VoiceStateManager: 0
			} ),
			sweepers: {
				...Options.defaultSweeperSettings,
				messages: {
					interval: 1000 * 60 * 5,
					lifetime: 1000 * 60 * 10
				}
			}
		} )
		container.octokit = new Octokit( {
			auth: env.GITHUB_PAT
		} )
		container.sequelize = sequelize
		container.stores.register( new ModelStore() )
	}

	public async start(): Promise<void> {
		await this.login( env.DISCORD_TOKEN )
	}
}

declare module '@sapphire/pieces' {
	interface Container {
		octokit: Octokit
		sequelize: Sequelize
	}
}
