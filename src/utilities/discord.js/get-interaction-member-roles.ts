import type { GuildMemberRoleManager, Interaction } from 'discord.js'
import { container } from '@sapphire/framework'

export const getInteractionMemberRoles = async ( interaction: Interaction<'present'> ): Promise<GuildMemberRoleManager> => {
	if ( !Array.isArray( interaction.member.roles ) ) {
		return interaction.member.roles
	}
	const guild = await container.client.guilds.fetch( interaction.guildId )
	const member = await guild.members.fetch( interaction.user.id )
	return member.roles
}
