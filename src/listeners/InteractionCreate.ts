import type { CommandInteraction, Interaction, UserContextMenuInteraction } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
import { Constants } from 'discord.js'
import { env } from '../lib'
import { Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'

@ApplyOptions<ListenerOptions>( {
	event: Constants.Events.INTERACTION_CREATE
} )
export class UserEvent extends Listener<typeof Constants.Events.INTERACTION_CREATE> {
	public run( interaction: Interaction ): void {
		if ( interaction.isCommand() ) void this.commandInteraction( interaction )
		else if ( interaction.isUserContextMenu() ) void this.userInteraction( interaction )
	}

	private async commandInteraction( interaction: CommandInteraction ): Promise<void> {
		const command = this.container.stores.get( 'slash-commands' ).get( interaction.commandName )
		if ( !command ) return

		try {
			await command.run( interaction )
			if ( env.NODE_ENV === 'development' ) {
				this.container.logger.info( `${ interaction.user.id } ran slash command ${ command.commandData.name }` )
			}
		} catch ( e ) {
			this.handleError( interaction, e )
		}
	}

	private async userInteraction( interaction: UserContextMenuInteraction ): Promise<void> {
		const command = this.container.stores.get( 'user-commands' ).get( interaction.commandName )
		if ( !command ) return

		try {
			await command.run( interaction )
			if ( env.NODE_ENV === 'development' ) {
				this.container.logger.info( `${ interaction.user.id } ran user command ${ command.commandData.name }` )
			}
		} catch ( e ) {
			this.handleError( interaction, e )
		}
	}

	private handleError( interaction: CommandInteraction | UserContextMenuInteraction, e: unknown ): void {
		this.container.logger.error( e )

		if ( interaction.replied ) {
			interaction
				.followUp( {
					content: 'There was a problem with your request.',
					ephemeral: true
				} )
				.catch( e => this.container.logger.fatal( 'An error occurred following up on an error', e ) )
		} else if ( interaction.deferred ) {
			interaction
				.editReply( {
					content: 'There was a problem with your request.'
				} )
				.catch( e => this.container.logger.fatal( 'An error occurred following up on an error', e ) )
		} else {
			interaction
				.reply( {
					content: 'There was a problem with your request.',
					ephemeral: true
				} )
				.catch( e => this.container.logger.fatal( 'An error occurred replying on an error', e ) )
		}
	}
}
