import { type ApplicationCommandRegistry, Command } from '@sapphire/framework'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import type { CommandOptions } from '@sapphire/framework'
import { env } from '../../lib'

@ApplyOptions<CommandOptions>( {
	description: 'Update the commands\'s ids in the database.',
	enabled: true,
	name: 'commands-data'
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
