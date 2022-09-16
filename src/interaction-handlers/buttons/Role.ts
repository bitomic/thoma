import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework'
import { ApplyOptions } from '@sapphire/decorators'
import { type ButtonInteraction } from 'discord.js'
import { ButtonIds, getInteractionGuild, getInteractionMemberRoles, simpleEmbed } from '../../utilities'
import Colors from '@bitomic/material-colors'

@ApplyOptions<InteractionHandlerOptions>( {
	interactionHandlerType: InteractionHandlerTypes.Button,
	name: 'RoleButton'
} )
export class UserButton extends InteractionHandler {
	public override parse( interaction: ButtonInteraction ) {
		if ( !interaction.customId.startsWith( `${ ButtonIds.Role }-` ) ) return this.none()
		return this.some()
	}

	public async run( interaction: ButtonInteraction<'cached' | 'raw'> ) {
		const roleId = interaction.customId.split( '-' ).pop()
		if ( !roleId ) return // dumb check

		await interaction.deferReply( { ephemeral: true } )
		try {
			const roles = await getInteractionMemberRoles( interaction )
			const hasRole = roles.cache.has( roleId )
			const guild = await getInteractionGuild( interaction )
			const role = await guild.roles.fetch( roleId )
			if ( hasRole ) {
				await roles.remove( roleId )
				void interaction.editReply( {
					embeds: await simpleEmbed( interaction, role?.color ?? Colors.green.s800, 'buttons', 'roleAddsuccess', { role: roleId } )
				} )
			} else {
				await roles.add( roleId )
				void interaction.editReply( {
					embeds: await simpleEmbed( interaction, role?.color ?? Colors.green.s800, 'buttons', 'roleRemovesuccess', { role: roleId } )
				} )
			}
		} catch {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'buttons', 'roleError', { role: roleId } )
			} )
		}
	}
}
