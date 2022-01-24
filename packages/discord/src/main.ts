import '@sapphire/plugin-logger/register'
import './database'
import { Client, sequelize } from './lib'
import { container } from '@sapphire/framework'
import { env } from '@sacarosa/shared'

( async () => {
	await sequelize.sync()
	const client = new Client()
	try {
		await client.login( env.DISCORD_TOKEN )
	} catch ( e ) {
		container.logger.error( e )
		client.destroy()
		process.exit( 1 )
	}
} )()
	.catch( e => container.logger.error( e ) )
