import { container, LogLevel, SapphireClient } from '@sapphire/framework'
import { Intents, Options } from 'discord.js'
import { env } from './environment'
import { ModelStore } from '../framework'
import { ScheduledTaskRedisStrategy } from '@sapphire/plugin-scheduled-tasks/register-redis'
import type { Sequelize } from 'sequelize'
import { sequelize } from './Sequelize'

export class UserClient extends SapphireClient {
	public constructor() {
		super( {
			defaultPrefix: env.DISCORD_PREFIX ?? '!',
			i18n: {
				fetchLanguage: async ( { guild, interactionGuildLocale, interactionLocale, user } ) => {
					const languages = container.stores.get( 'models' ).get( 'languages' )
					const lang = interactionGuildLocale
						?? interactionLocale
						?? ( user ? await languages.get( user.id ) : null )
						?? ( guild ? await languages.get( guild.id ) : null )
					return lang && container.i18n.languages.has( lang ) ? lang : env.DEFAULT_LANGUAGE
				},
				i18next: {
					fallbackLng: env.DEFAULT_LANGUAGE
				}
			},
			intents: [
				Intents.FLAGS.GUILDS,
				Intents.FLAGS.GUILD_MESSAGES
			],
			loadDefaultErrorListeners: true,
			logger: {
				level: LogLevel.Info
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
			},
			tasks: {
				strategy: new ScheduledTaskRedisStrategy( {
					bull: {
						connection: {
							db: env.REDIS_DB,
							host: env.REDIS_HOST,
							password: env.REDIS_PASSWORD,
							port: env.REDIS_PORT,
							username: env.REDIS_USERNAME
						},
						defaultJobOptions: {
							removeOnComplete: true
						}
					}
				} )
			}
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
		sequelize: Sequelize
	}
}
