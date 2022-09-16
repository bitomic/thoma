import { ScheduledTask, type ScheduledTaskOptions } from '@sapphire/plugin-scheduled-tasks'
import { ApplyOptions } from '@sapphire/decorators'
import type { ReminderPayload } from '../../utilities'
import { type MessageEmbedOptions, User } from 'discord.js'
import Colors from '@bitomic/material-colors'
import { resolveKey, type Target } from '@sapphire/plugin-i18next'

@ApplyOptions<ScheduledTaskOptions>( {
	enabled: true,
	name: 'reminder'
} )
export class UserTask extends ScheduledTask {
	public async run( payload: ReminderPayload ): Promise<void> {
		if ( !this.container.client.user?.id ) {
			this.container.tasks.create( 'reminder', payload, 1000 * 10 )
			return
		}

		const channel = payload.guild && payload.channel && !payload.dm
			? await ( await this.container.client.guilds.fetch( payload.guild ) ).channels.fetch( payload.channel )
			: await this.container.client.users.fetch( payload.user )

		if ( !channel ||  'type' in channel && !channel.isText()  ) return

		const description = await resolveKey( channel as unknown as Target, 'command-replies/utilities:reminderDescription', {
			time: Math.floor( payload.created / 1000 )
		} )
		const reasonField = await resolveKey( channel as unknown as Target, 'command-replies/utilities:reminderReasonField' )
		const title = await resolveKey( channel as unknown as Target, 'command-replies/utilities:reminderTitle' )
		const embed: MessageEmbedOptions = {
			color: Colors.green.s800,
			description,
			fields: [ {
				name: reasonField,
				value: payload.reason
			} ],
			title
		}

		if ( channel instanceof User ) {
			void channel.send( { embeds: [ embed ] } )
		} else {
			const guild = await this.container.client.guilds.fetch( payload.guild ?? '' )
			const member = await guild.members.fetch( payload.user )
				.catch( () => null )

			if ( !member ) return

			void channel.send( {
				content: `<@!${ payload.user }>`,
				embeds: [ embed ]
			} )
		}
	}
}

declare module '@sapphire/plugin-scheduled-tasks' {
	interface ScheduledTasks {
		reminder: never;
	}
}
