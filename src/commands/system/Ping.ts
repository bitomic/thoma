import { type ApplicationCommandRegistry, Command, RegisterBehavior } from '@sapphire/framework'
import type { CommandInteraction, Message } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandOptions } from '@sapphire/framework'
import { env } from '../../lib'

@ApplyOptions<CommandOptions>( {
	description: 'Pong!',
	enabled: true,
	name: 'ping'
} )
export class UserCommand extends Command {
	public override registerApplicationCommands( registry: ApplicationCommandRegistry ): void {
		registry.registerChatInputCommand(
			builder => builder
				.setName( this.name )
				.setDescription( this.description )
				.addStringOption( input => input
					.setName( 'interwiki' )
					.setDescription( 'Interwiki del wiki' )
					.setRequired( true ) ),
			{
				...env.DISCORD_DEVELOPMENT_SERVER
					? { guildIds: [ env.DISCORD_DEVELOPMENT_SERVER ] }
					: {},
				behaviorWhenNotIdentical: RegisterBehavior.Overwrite
			}
		)
	}

	public override chatInputRun( interaction: CommandInteraction ): void {
		void interaction.reply( 'Pong!' )
	}

	public override messageRun( message: Message ): void {
		void message.reply( 'Pong!' )
	}
}
