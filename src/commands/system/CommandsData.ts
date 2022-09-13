import { Command, type CommandOptions } from '../../framework'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { env } from '../../lib'
import { simpleEmbed } from '../../utilities'
import Colors from '@bitomic/material-colors'

@ApplyOptions<CommandOptions>( {
	dm: false,
	enabled: true,
	guildIds: [ env.DISCORD_DEVELOPMENT_SERVER ],
	name: 'commands-data',
	preconditions: [ 'OwnerOnly' ]
} )
export class UserCommand extends Command {
	public override async chatInputRun( interaction: CommandInteraction ): Promise<void> {
		void interaction.reply( {
			embeds: await simpleEmbed( interaction, Colors.green.s800, 'system', 'commandsData' )
		} )

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
