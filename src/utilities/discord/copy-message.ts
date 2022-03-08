import type { GuildTextBasedChannel, Message, PartialWebhookFields, Webhook } from 'discord.js'
import { container } from '@sapphire/framework'

type WebhookMessage = ReturnType<PartialWebhookFields[ 'send' ]>

export const copyMessage = async ( { channel, message, messageToEdit }: { channel: GuildTextBasedChannel, message: Message, messageToEdit?: string } ): Promise<WebhookMessage | null> => {
	const { user } = container.client
	if ( !user ) {
		container.logger.error( 'User is not initialized.' )
		return null
	}

	const parent = channel.isThread() ? channel.parent : channel
	if ( !parent ) return null

	let webhook: Webhook | null = null

	if ( messageToEdit ) {
		try {
			const message = await channel.messages.fetch( messageToEdit )
			webhook = await message.fetchWebhook()
		} catch {
			webhook = null
		}
	}

	if ( !webhook ) {
		const webhooks = await parent.fetchWebhooks()
		webhook = webhooks.find( w => w.owner?.id === user.id )
			?? await parent.createWebhook(
				user.username,
				{ avatar: user.avatarURL( { format: 'png' } ) }
			)
	}

	const source = message.webhookId ? message.author : user
	const webhookData = {
		avatarURL: source.avatarURL( { format: 'png' } ) ?? '',
		username: source.username
	}

	const webhookMessageOptions = {
		content: message.content.length === 0 ? null : message.content,
		embeds: message.embeds
	}

	return messageToEdit
		? webhook.editMessage( messageToEdit, webhookMessageOptions )
		: webhook.send( {
			...webhookData,
			...webhookMessageOptions
		} )
}
