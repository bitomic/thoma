import { container } from '@sapphire/framework'
import { Webhooks } from '../database'

export interface IWebhookData {
	avatarURL: string
	username: string
}

interface IGetWebhookDataOptions {
	channelId: string
	guildId: string
}

export const getWebhookData = async ( { channelId, guildId }: IGetWebhookDataOptions ): Promise<IWebhookData> => {
	const records = await Webhooks.findAll( {
		where: {
			snowflake: [
				guildId, channelId
			]
		}
	} )
	const { avatar, name } = records.find( r => r.type === 'channel' )
		?? records[ 0 ]
		?? {
			avatar: container.client.user?.avatarURL( { format: 'png' } ) ?? '',
			name: container.client.user?.username ?? 'Usuario desconocido'
		}

	return {
		avatarURL: avatar,
		username: name
	}
}
