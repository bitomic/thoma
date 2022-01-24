import { container } from '@sapphire/framework'
import type { NonThreadGuildTextBasedChannelTypes } from '@sapphire/discord.js-utilities'
import type { Webhook } from 'discord.js'

export const getWebhook = async ( channel: NonThreadGuildTextBasedChannelTypes ): Promise<Webhook> => {
	const webhooks = await channel.fetchWebhooks()
	return webhooks.find( w => w.owner?.id === container.client.user?.id ) ?? channel.createWebhook( container.client.user?.username ?? 'null' )
}
