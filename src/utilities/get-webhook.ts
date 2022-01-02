import type { TextChannel, Webhook } from 'discord.js'
import { container } from '@sapphire/framework'

export const getWebhook = async ( channel: TextChannel ): Promise<Webhook> => {
	const webhooks = await channel.fetchWebhooks()
	return webhooks.find( w => w.owner?.id === container.client.user?.id ) ?? channel.createWebhook( container.client.user?.username ?? 'null' )
}
