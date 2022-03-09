import { fandomVerify, getInteractionMember } from '../../utilities'
import { Modal, showModal, TextInputComponent } from 'discord-modals'
import { ApplyOptions } from '@sapphire/decorators'
import { Constants } from 'discord.js'
import type { Interaction } from 'discord.js'
import { Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'

@ApplyOptions<ListenerOptions>( {
	event: Constants.Events.INTERACTION_CREATE,
	name: 'ButtonFandomVerify'
} )
export class UserEvent extends Listener {
	public async run( interaction: Interaction ): Promise<void> {
		if ( !interaction.isButton() || interaction.customId !== 'fandom-verify' || !interaction.inGuild() ) return

		const fandomUsers = this.container.stores.get( 'models' ).get( 'fandom-user' )
		const alreadyExists = await fandomUsers.get( interaction.user.id )

		if ( alreadyExists ) {
			await interaction.deferReply( { ephemeral: true } )
			const member = await getInteractionMember( interaction )
			const embed = await fandomVerify( {
				guildId: interaction.guildId,
				member
			} )
			await interaction.editReply( { embeds: [ embed ] } )
		} else {
			const modal = new Modal()
				.setCustomId( 'fandom-verify' )
				.setTitle( 'Verifícate usando tu cuenta de Fandom' )
				.addComponents(
					new TextInputComponent()
						.setCustomId( 'username' )
						.setLabel( 'Nombre de usuario' )
						.setRequired( true )
						.setStyle( 'SHORT' )
				)
			showModal( modal, {
				client: this.container.client,
				interaction
			} )
		}
	}
}
