import { Colors, Events, getInteractionChannel } from '../../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import type { IAMQPMessageData } from '../../utilities'
import { Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'
import { Message } from 'discord.js'

@ApplyOptions<ListenerOptions>( {
	event: Events.AMQP_REGISTER
} )
export class UserEvent extends Listener {
	public async run( interaction: CommandInteraction<'present'>, task: string, title: string ): Promise<void> {
		await interaction.reply( {
			embeds: [
				{
					color: Colors.lime[ 10 ],
					description: 'Se ha registrado una tarea.'
				}
			]
		} )


		let message = await interaction.fetchReply()
		if ( !( message instanceof Message ) ) {
			const channel = await getInteractionChannel( interaction )
			if ( !channel ) return
			message = await channel.messages.fetch( message.id )
		}

		const thread = await message.startThread( {
			name: `${ title } @ ${ Date.now().toString( 16 ) }`
		} )


		const data: IAMQPMessageData = {
			channelId: interaction.channelId,
			guildId: interaction.guildId,
			task,
			threadId: thread.id
		}
		this.container.client.emit( Events.AMQP_SEND, data )
	}
}
