import { ApplyOptions } from '@sapphire/decorators'
import { env } from '@sacarosa/shared'
import { Events } from '../../utilities'
import type { IAMQPMessageData } from '../../utilities'
import { Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'

@ApplyOptions<ListenerOptions>( {
	event: Events.AMQP_SEND
} )
export class UserEvent extends Listener {
	public async run( message: IAMQPMessageData ): Promise<void> {
		const ch = await this.container.amqp.createChannel()
		await ch.assertQueue( env.RABBITMQ_QUEUE )
		ch.sendToQueue(
			env.RABBITMQ_QUEUE,
			Buffer.from( JSON.stringify( message ) )
		)
	}
}
