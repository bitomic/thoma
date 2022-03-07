import type { CommandInteraction, GuildTextBasedChannel } from 'discord.js'
import { getInteractionGuild } from './get-interaction-guild'

export const getInteractionChannel = async ( interaction: CommandInteraction<'present'> ): Promise<GuildTextBasedChannel | null> => {
	let { channel } = interaction

	if ( !channel ) {
		const guild = await getInteractionGuild( interaction )
		const guildChannel = await guild.channels.fetch( interaction.channelId )
		if ( guildChannel?.isText() ) channel = guildChannel
	}

	return channel
}
