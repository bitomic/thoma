/* eslint-disable no-console */
import amqp from 'amqplib'
import { env } from '@sacarosa/shared'
import type { IAMQPConsumerResult } from './lib'
import path from 'path'
import { Store } from './lib'

export interface IAMQPMessage {
	task: string
}

( async () => {
	const store = new Store( {
		path: path.resolve( __dirname, 'consumers' )
	} )
	await store.load()
	console.info( 'Consumers loaded' )

	const conn = await amqp.connect( env.RABBITMQ_URL )
	const ch = await conn.createChannel()
	await ch.assertQueue( env.RABBITMQ_QUEUE )
	await ch.prefetch( 1 )
	await ch.consume(
		env.RABBITMQ_QUEUE,
		// eslint-disable-next-line @typescript-eslint/no-misused-promises
		async message => {
			if ( !message ) {
				console.warn( 'Received a null message' )
				return
			}

			const data = JSON.parse( message.content.toString() ) as IAMQPMessage
			const consumer = store.get( data.task )
			if ( consumer ) {
				console.info( `Running task: ${ data.task }` )
				const t1 = Date.now()
				let result: IAMQPConsumerResult
				try {
					result = await consumer.consume( message )
				} catch ( e ) {
					console.error( e )
					result = {
						success: false
					}
				}
				const t2 = Date.now()
				console.info( `Finished task: ${ data.task } (${ t2 - t1 }ms)` )

				const { message: details, success } = result
				await ch.assertQueue( env.RABBITMQ_QUEUE_OUTPUT )
				ch.sendToQueue(
					env.RABBITMQ_QUEUE_OUTPUT,
					Buffer.from( JSON.stringify( {
						...data,
						message: details,
						success
					} ) )
				)
			} else {
				console.warn( `There is no consumer for task "${ data.task }"` )
			}
			ch.ack( message )
		},
		{
			noAck: false
		}
	)
} )()
	.catch( e => console.error( e ) )
