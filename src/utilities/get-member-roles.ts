import { container } from '@sapphire/framework'
import type { Interaction } from 'discord.js'

export const getMemberRoles = async ( interaction: Interaction<'cached'> ) => {
	if ( !Array.isArray( interaction.member.roles ) ) {
		return interaction.member.roles
	}
	const guild = await container.client.guilds.fetch( interaction.guildId )
	const member = await guild.members.fetch( interaction.user.id )
	return member.roles
}
