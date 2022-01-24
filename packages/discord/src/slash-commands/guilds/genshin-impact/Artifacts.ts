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
	defaultPermission: true,
	description: 'Actualiza la lista de artefactos y crea las redirecciones necesarias.',
	enabled: true,
	guilds: [ 'genshinImpact' ],
	name: 'artefactos'
} )
export class UserSlash extends SlashCommand {
	public run( interaction: CommandInteraction<'present'> ): void {
		this.container.client.emit(
			Events.AMQP_REGISTER,
			interaction,
			'artifacts',
			'Artefactos'
		)
	}
}
