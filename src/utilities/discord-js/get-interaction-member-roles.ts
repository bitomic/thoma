import type { GuildMemberRoleManager, Interaction } from 'discord.js'
import { container } from '@sapphire/framework'
import { InteractionNotInGuild } from '../../errors'

export const getInteractionMemberRoles = async ( interaction: Interaction ): Promise<GuildMemberRoleManager> => {
	if ( !interaction.guildId ) throw new InteractionNotInGuild()
	if ( interaction.member && !Array.isArray( interaction.member.roles ) ) {
		return interaction.member.roles
	}
	const guild = await container.client.guilds.fetch( interaction.guildId )
	const member = await guild.members.fetch( interaction.user.id )
	return member.roles
}
