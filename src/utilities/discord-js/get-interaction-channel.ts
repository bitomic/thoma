import type { GuildTextBasedChannel, Interaction } from 'discord.js'
import { getInteractionGuild } from './get-interaction-guild'
import { InteractionNotInGuild } from '../../errors'

export const getInteractionChannel = async ( interaction: Interaction<'cached' | 'raw'> ): Promise<GuildTextBasedChannel> => {
	if ( !interaction.channelId ) throw new InteractionNotInGuild()
	let { channel } = interaction

	if ( !channel ) {
		const guild = await getInteractionGuild( interaction )
		const guildChannel = await guild.channels.fetch( interaction.channelId )
		if ( guildChannel?.isText() ) channel = guildChannel
	}

	if ( channel?.isText() && 'guildId' in channel ) return channel
	throw new InteractionNotInGuild()
}
