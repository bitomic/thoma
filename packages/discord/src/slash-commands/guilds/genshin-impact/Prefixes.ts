import { Events, Guilds } from '../../../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { SlashCommand } from '../../../framework'
import type { SlashCommandOptions } from '../../../framework'
import { SlashPermissions } from '../../../decorators'


@SlashPermissions( {
	ids: [ Guilds.genshinImpact.roles.contentCreator ],
	permission: true,
	type: 'ROLE'
} )
@ApplyOptions<SlashCommandOptions>( {
	defaultPermission: false,
	description: 'Actualiza los prefijos de los objetos.',
	enabled: true,
	guilds: [ 'genshinImpact' ],
	name: 'prefijos'
} )
export class UserSlash extends SlashCommand {
	public run( interaction: CommandInteraction<'present'> ): void {
		this.container.client.emit(
			Events.AMQP_REGISTER,
			interaction,
			'prefixes',
			'Prefijos'
		)
	}
}
