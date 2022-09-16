import type { Guild, Interaction } from 'discord.js'
import { container } from '@sapphire/framework'
import { InteractionNotInGuild } from '../../errors'

export const getInteractionGuild = ( interaction: Interaction<'cached' | 'raw'> ): Guild | Promise<Guild> => {
	if ( !interaction.guildId ) throw new InteractionNotInGuild()
	return interaction.guild
		?? container.client.guilds.fetch( interaction.guildId )
}
