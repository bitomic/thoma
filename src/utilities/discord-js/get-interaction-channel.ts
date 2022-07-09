import type { CommandInteraction, GuildTextBasedChannel } from 'discord.js'
import { getInteractionGuild } from './get-interaction-guild'
import { InteractionNotInGuild } from '../../errors'

export const getInteractionChannel = async ( interaction: CommandInteraction ): Promise<GuildTextBasedChannel | null> => {
	if ( !interaction.channelId ) throw new InteractionNotInGuild()
	let { channel } = interaction

	if ( !channel ) {
		const guild = await getInteractionGuild( interaction )
		const guildChannel = await guild.channels.fetch( interaction.channelId )
		if ( guildChannel?.isText() ) channel = guildChannel
	}

	return channel as GuildTextBasedChannel | null
}
