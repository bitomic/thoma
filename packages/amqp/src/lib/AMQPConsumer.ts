import type amqp from 'amqplib'
import { env } from '@sacarosa/shared'
import { Fandom } from 'mw.js'
import type { FandomBot } from 'mw.js'

export interface IAMQPConsumerOptions {
	name: string
}

export abstract class AMQPConsumer {
	public static readonly QUEUE_NAME = 'botomic'

	protected readonly fandom: Fandom
	public readonly name: string

	public constructor( options: IAMQPConsumerOptions ) {
		this.fandom = new Fandom( {
			cookies: 'cookies.json'
		} )
		this.name = options.name
	}

	public abstract consume( message: amqp.Message ): boolean | Promise<boolean>

	protected getFandomBot(): Promise<FandomBot> {
		return this.fandom.login( {
			password: env.FANDOM_PASSWORD,
			username: env.FANDOM_USERNAME
		} )
	}
}
