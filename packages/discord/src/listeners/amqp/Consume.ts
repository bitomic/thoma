import { Colors, Events } from '../../utilities'
import type amqp from 'amqplib'
import { ApplyOptions } from '@sapphire/decorators'
import type { IAMQPMessageData } from '../../utilities'
import { isGuildBasedChannel } from '@sapphire/discord.js-utilities'
import { Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'
import type { MessageEmbedOptions } from 'discord.js'

@ApplyOptions<ListenerOptions>( {
	event: Events.AMQP_CONSUME
} )
export class UserEvent extends Listener {
	public async run( message: amqp.ConsumeMessage ): Promise<void> {
		const data = JSON.parse( message.content.toString() ) as IAMQPMessageData
		const guild = await this.container.client.guilds.fetch( data.guildId )
			.catch( () => null )
		const channel = await guild?.channels.fetch( data.channelId )
			.catch( () => null )
		if ( !isGuildBasedChannel( channel ) ) return
		const thread = await channel.threads.fetch( data.threadId )
			.catch( () => null )
		if ( !thread ) return

		const description = data.success
			? 'Se ha completado la tarea exitosamente.'
			: 'Ha ocurrido un error con la tarea.'

		const embed: MessageEmbedOptions = {
			color: data.success ? Colors.green[ 10 ] : Colors.red[ 10 ],
			description
		}
		if ( data.message ) {
			embed.fields = [
				{
					name: 'Detalles',
					value: data.message
				}
			]
		}

		await thread.send( {
			embeds: [ embed ]
		} )
		await thread.setArchived( true )
	}
}
