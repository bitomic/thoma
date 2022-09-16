import { Command, type CommandOptions } from '../../framework'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import Colors from '@bitomic/material-colors'
import type { ReminderPayload } from '../../utilities'

enum Options {
	Announce = 'announce',
	Dm = 'dm',
	Reason = 'reason',
	When = 'when'
}

@ApplyOptions<CommandOptions>( {
	dm: true,
	enabled: true,
	name: 'remindme'
} )
export class UserCommand extends Command {
	public override setOptions(): void {
		this.applicationCommandBase.options = [
			this.createOption( {
				name: Options.When,
				required: true,
				type: 'STRING'
			} ),
			this.createOption( {
				name: Options.Reason,
				required: true,
				type: 'STRING'
			} ),
			this.createOption( {
				name: Options.Dm,
				type: 'BOOLEAN'
			} ),
			this.createOption( {
				name: Options.Announce,
				type: 'BOOLEAN'
			} )
		]
	}

	public override async chatInputRun( interaction: CommandInteraction ): Promise<void> {
		const when = interaction.options.getString( Options.When, true )
		const reason = interaction.options.getString( Options.Reason, true )
		const dm = interaction.options.getBoolean( Options.Dm ) ?? false
		const announce = interaction.options.getBoolean( Options.Announce ) ?? false

		const time = this.parseTime( when )
		if ( !time ) {
			void interaction.reply( {
				embeds: await this.simpleEmbed( {
					color: Colors.amber.s800,
					key: 'invalidTime',
					replace: { input: when },
					target: interaction
				} ),
				ephemeral: true
			} )
			return
		}

		void interaction.reply( {
			embeds: await this.simpleEmbed( {
				color: Colors.green.s800,
				key: 'createdReminder',
				replace: { reason, time: Math.floor( time / 1000 ) },
				target: interaction
			} ),
			ephemeral: !announce
		} )

		const isGuild = interaction.inGuild()
		const payload: ReminderPayload = {
			channel: isGuild ? interaction.channelId : null,
			created: Date.now(),
			dm,
			guild: isGuild ? interaction.guildId : null,
			reason,
			user: interaction.user.id
		}
		this.container.tasks.create( 'reminder', payload, time - Date.now() )
	}

	protected parseTime( time: string ): number | null {
		const parts = time.toLowerCase().match( /(\d+)([smhd])/ )
		if ( !parts ) return null

		let addedTime = Date.now()
		for ( const part of parts ) {
			const [ , amount, unit ] = part.match( /(\d+)([smhd])/ ) ?? []
			const qty = parseInt( amount ?? '', 10 )
			if ( !qty || !unit ) continue

			if ( unit === 's' ) addedTime += 1000 * qty
			else if ( unit === 'm' ) addedTime += 1000 * 60 * qty
			else if ( unit === 'h' ) addedTime += 1000 * 60 * 60 * qty
			else if ( unit === 'd' ) addedTime += 1000 * 60 * 60 * 24 * qty
		}

		return addedTime
	}
}
