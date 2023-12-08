import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework'
import { ApplyOptions } from '@sapphire/decorators'
import { type ButtonInteraction, Modal } from 'discord.js'
import { ButtonIds, fandomVerify, getInteractionMember, ModalIds } from '../../utilities'
import { resolveKey } from '@sapphire/plugin-i18next'

@ApplyOptions<InteractionHandlerOptions>( {
	interactionHandlerType: InteractionHandlerTypes.Button,
	name: 'FandomVerifyButton'
} )
export class UserButton extends InteractionHandler {
	public override parse( interaction: ButtonInteraction ) {
		if ( interaction.customId !== ButtonIds.FandomVerify ) return this.none()
		return this.some()
	}

	public async run( interaction: ButtonInteraction<'cached' | 'raw'> ) {
		const fandomUsers = this.container.stores.get( 'models' ).get( 'fandom-user' )
		const alreadyExists = await fandomUsers.get( interaction.user.id )

		if ( alreadyExists ) {
			await interaction.deferReply( { ephemeral: true } )
			const member = await getInteractionMember( interaction )
			const embed = await fandomVerify( {
				interaction,
				member,
				username: alreadyExists
			} )
			await interaction.editReply( { embeds: [ embed ] } )
		} else {
			const title = await resolveKey( interaction, 'command-replies/modals:fandomVerifyTitle' )
			const label = await resolveKey( interaction, 'command-replies/modals:fandomVerifyUsername' )
			const modal = new Modal( {
				components: [
					{
						components: [ {
							customId: ModalIds.FieldUsername,
							label,
							required: true,
							style: 'SHORT',
							type: 'TEXT_INPUT'
						} ],
						type: 'ACTION_ROW'
					}
				],
				customId: ModalIds.ModalFandomVerify,
				title
			} )
			await interaction.showModal( modal )
		}
	}
}
