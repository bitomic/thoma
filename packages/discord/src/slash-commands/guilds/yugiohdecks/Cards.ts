import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { env } from '@sacarosa/shared'
import { Events } from '../../../utilities'
import { SlashCommand } from '../../../framework'
import type { SlashCommandOptions } from '../../../framework'
import { SlashPermissions } from '../../../decorators'

@SlashPermissions( {
	ids: [
 env.DISCORD_OWNER as `${ number }`, '257300180024426496'
	],
	permission: true,
	type: 'USER'
} )
@ApplyOptions<SlashCommandOptions>( {
	defaultPermission: false,
	description: 'Actualiza la lista de cartas en Wiki Yu-Gi-Oh! Decks.',
	enabled: true,
	guilds: [ 'genshinImpact' ],
	name: 'cartas'
} )
export class UserSlash extends SlashCommand {
	public run( interaction: CommandInteraction<'present'> ): void {
		this.container.client.emit(
			Events.AMQP_REGISTER,
			interaction,
			'cards',
			'Cartas'
		)
	}
}
