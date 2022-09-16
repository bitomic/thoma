import { Command, type CommandOptions } from '../../framework'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'

@ApplyOptions<CommandOptions>( {
	dm: true,
	enabled: true,
	name: 'ping'
} )
export class UserCommand extends Command {
	public override chatInputRun( interaction: CommandInteraction ): void {
		void interaction.reply( 'Pong!' )
	}
}
