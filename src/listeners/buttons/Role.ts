import { Constants, type Interaction, MessageEmbed } from 'discord.js'
import { Listener, type ListenerOptions } from '@sapphire/framework'
import { ApplyOptions } from '@sapphire/decorators'
import { Colors } from '@bitomic/material-colors'
import { getInteractionMemberRoles } from '../../utilities'

@ApplyOptions<ListenerOptions>( {
	event: Constants.Events.INTERACTION_CREATE
} )
export class UserEvent extends Listener {
	public async run( interaction: Interaction ) {
		if ( !interaction.isButton() || !interaction.inGuild() || !interaction.customId.startsWith( 'role-' ) ) return
		const roleId = interaction.customId.split( '-' ).pop()
		if ( !roleId ) return // dumb check

		await interaction.deferReply( { ephemeral: true } )
		try {
			const roles = await getInteractionMemberRoles( interaction )
			let action: string
			if ( roles.cache.has( roleId ) ) {
				await roles.remove( roleId )
				action = 'removido'
			} else {
				await roles.add( roleId )
				action = 'añadido'
			}
			const embed = new MessageEmbed( {
				color: Colors.green.s800,
				description: `Se ha ${ action } el rol <@&${ roleId }> exitosamente.`,
			} )
			void interaction.editReply( { embeds: [ embed ] } )
		} catch {
			const embed = new MessageEmbed( {
				color: Colors.red.s800,
				description: 'Ha ocurrido un error al intentar actualizar tus roles. Intentalo de nuevo más tarde.',
			} )
			void interaction.editReply( { embeds: [ embed ] } )
		}
	}
}
