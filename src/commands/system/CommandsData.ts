import { type ApplicationCommandRegistry, Command, type CommandOptions } from '@sapphire/framework'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { env } from '../../lib'
import { getCommand } from '../../utilities'

@ApplyOptions<CommandOptions>( {
	enabled: true,
	...getCommand( 'system.commands-data' )
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
		void interaction.reply( 'commands-data' )
		const models = this.container.stores.get( 'models' )
		const commandsData = models.get( 'commands' )
		const commands = await this.container.client.application?.commands.fetch()
		for ( const [ id, command ] of commands ?? [] ) {
			await commandsData.addIdHint( command.name, id )
		}
		const guilds = await this.container.client.guilds.fetch()
		for ( const [ _, guild ] of guilds ) {
			const guildCommands = await ( await guild.fetch() ).commands.fetch()
			for ( const [ id, command ] of guildCommands ) {
				await commandsData.addIdHint( command.name, id )
			}
		}
	}
}
