import type { Webhook, WebhookMessageOptions } from 'discord.js'
import { getWebhook } from './get-webhook'
import { getWebhookData } from './get-webhook-data'
import type { NonThreadGuildTextBasedChannelTypes } from '@sapphire/discord.js-utilities'

export const sendWebhook = async ( channel: NonThreadGuildTextBasedChannelTypes, options: WebhookMessageOptions ): ReturnType<Webhook[ 'send' ]> => {
	const webhook = await getWebhook( channel )
	const data = await getWebhookData( {
		channelId: channel.id,
		guildId: channel.guildId
	} )
	return webhook.send( {
		...data,
		...options
	} )
}