import type amqp from 'amqplib'
import { env } from '@sacarosa/shared'
import { Fandom } from 'mw.js'
import type { FandomBot } from 'mw.js'

export interface IAMQPConsumerOptions {
	name: string
}

export interface IAMQPConsumerResult {
	message?: string
	success: boolean
}

export abstract class AMQPConsumer {
	protected readonly fandom: Fandom
	public readonly name: string

	public constructor( options: IAMQPConsumerOptions ) {
		this.fandom = new Fandom( {
			cookies: 'cookies.json'
		} )
		this.name = options.name
	}

	public abstract consume( message: amqp.Message ): IAMQPConsumerResult | Promise<IAMQPConsumerResult>

	protected getFandomBot(): Promise<FandomBot> {
		return this.fandom.login( {
			password: env.FANDOM_PASSWORD,
			username: env.FANDOM_USERNAME
		} )
	}
}
