import type { CommandInteraction, NewsChannel, TextChannel } from 'discord.js'
import { container } from '@sapphire/framework'

export const getInteractionChannel = async ( interaction: CommandInteraction<'present'> ): Promise<NewsChannel | TextChannel | null> => {
	const channel = interaction.channel
		?? await ( await container.client.guilds.fetch( interaction.guildId ) ).channels.fetch( interaction.channelId )
	if ( channel?.type !== 'GUILD_TEXT' && channel?.type !== 'GUILD_NEWS' ) return null
	return channel
}
