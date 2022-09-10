import { type ApplicationCommandRegistry, Command, type CommandOptions } from '@sapphire/framework'
import type { CommandInteraction, Message } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'

@ApplyOptions<CommandOptions>( {
	description: 'Pong!',
	enabled: true,
	name: 'ping'
} )
export class UserCommand extends Command {
	public override async registerApplicationCommands( registry: ApplicationCommandRegistry ): Promise<void> {
		registry.registerChatInputCommand(
			builder => builder
				.setName( this.name )
				.setDescription( this.description ),
			await this.container.stores.get( 'models' ).get( 'commands' )
				.getData( this.name )
		)
	}

	public override chatInputRun( interaction: CommandInteraction ): void {
		void interaction.reply( 'Pong!' )
	}

	public override messageRun( message: Message ): void {
		void message.reply( 'Pong!' )
	}
}
