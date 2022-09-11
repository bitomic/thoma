import type { CommandInteraction, Message } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
import { Command, type CommandOptions } from '../../framework'

@ApplyOptions<CommandOptions>( {
	dm: true,
	enabled: true,
	name: 'ping'
} )
export class UserCommand extends Command {
	public override chatInputRun( interaction: CommandInteraction ): void {
		void interaction.reply( 'Pong!' )
	}

	public override messageRun( message: Message ): void {
		void message.reply( 'Pong!' )
	}
}
