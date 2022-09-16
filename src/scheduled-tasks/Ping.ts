import { ScheduledTask, type ScheduledTaskOptions } from '@sapphire/plugin-scheduled-tasks'
import { ApplyOptions } from '@sapphire/decorators'

@ApplyOptions<ScheduledTaskOptions>( {
	enabled: false,
	interval: 1000 * 5 // 5 seconds
} )
export class UserTask extends ScheduledTask {
	public run(): void {
		this.container.logger.info( 'Pong!' )
	}
}
