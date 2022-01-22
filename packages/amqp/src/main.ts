/* eslint-disable no-console */
import { AMQPConsumer, Store } from './lib'
import amqp from 'amqplib'
import { env } from '@sacarosa/shared'
import path from 'path'

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
	await ch.assertQueue( AMQPConsumer.QUEUE_NAME )
	await ch.prefetch( 1 )
	await ch.consume(
		AMQPConsumer.QUEUE_NAME,
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
				const success = await consumer.consume( message )
				const t2 = Date.now()
				console.info( `Finished task: ${ data.task } (${ t2 - t1 }ms)` )

				const outputQueue = `${ AMQPConsumer.QUEUE_NAME }.output`
				await ch.assertQueue( outputQueue )
				ch.sendToQueue(
					outputQueue,
					Buffer.from( JSON.stringify( {
						...data,
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
