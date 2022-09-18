import { ApplyOptions } from '@sapphire/decorators'
import { Listener, type ListenerOptions } from '@sapphire/framework'

@ApplyOptions<ListenerOptions>( {
	event: 'ready',
	once: true
} )
export class UserEvent extends Listener {
	public async run(): Promise<void> {
		this.container.logger.info( 'Ready!' )

		await this.container.sequelize.sync()
		this.container.client.user?.setPresence( {
			activities: [ {
				name: 'alquimia',
				type: 'PLAYING'
			} ]
		} )
	}
}
