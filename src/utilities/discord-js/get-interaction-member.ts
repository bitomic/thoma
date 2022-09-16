import { getInteractionGuild } from './get-interaction-guild'
import { GuildMember, type Interaction } from 'discord.js'

export const getInteractionMember = async ( interaction: Interaction<'cached' | 'raw'> ): Promise<GuildMember> => {
	if ( interaction.member instanceof GuildMember ) return interaction.member

	const guild = await getInteractionGuild( interaction )
	return guild.members.fetch( interaction.user.id )
}
