import { type ApplicationCommandRegistry, Command } from '@sapphire/framework'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import type { CommandOptions } from '@sapphire/framework'
import { env } from '../../lib'

@ApplyOptions<CommandOptions>( {
	description: 'Remove all application commands (manually restart after).',
	enabled: true,
	name: 'remove-commands'
} )
export class UserCommand extends Command {
	public override async registerApplicationCommands( registry: ApplicationCommandRegistry ): Promise<void> {
		registry.registerChatInputCommand(
			builder => builder
				.setName( this.name )
				.setDescription( this.description ),
			{
				...await this.container.stores.get( 'models' ).get( 'commands' )
					.getData( this.name ),
				guildIds: [ env.DISCORD_DEVELOPMENT_SERVER ]
			}
		)
	}

	public override async chatInputRun( interaction: CommandInteraction ): Promise<void> {
		void interaction.reply( 'remove-commands' )
		await this.container.stores.get( 'models' ).get( 'commands' )
			.truncate()

		await this.container.client.application?.commands.set( [] )
		const guilds = await this.container.client.guilds.fetch()
		for ( const [ _, guild ] of guilds ) {
			const fetchGuild = await guild.fetch()
			const guildCommands = await fetchGuild.commands.fetch()
			if ( guildCommands.size === 0 ) continue
			await fetchGuild.commands.set( [] )
		}
	}
}
