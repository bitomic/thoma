import { InteractionHandler, type InteractionHandlerOptions, InteractionHandlerTypes } from '@sapphire/framework'
import { ApplyOptions } from '@sapphire/decorators'
import { type ModalSubmitInteraction } from 'discord.js'
import { fandomVerify, getInteractionMember, ModalIds, simpleEmbed } from '../../utilities'
import { Fandom } from 'mw.js'
import Colors from '@bitomic/material-colors'

@ApplyOptions<InteractionHandlerOptions>( {
	interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
	name: 'FandomVerifyModal'
} )
export class UserButton extends InteractionHandler {
	public override parse( interaction: ModalSubmitInteraction ) {
		if ( interaction.customId !== ModalIds.ModalFandomVerify ) return this.none()
		return this.some()
	}

	public async run( interaction: ModalSubmitInteraction<'cached' | 'raw'> ) {
		await interaction.deferReply( { ephemeral: true } )

		const username = interaction.fields.getTextInputValue( ModalIds.FieldUsername )
		const tag = await new Fandom().getUserDiscordTag( username )

		if ( !tag ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( {
					category: 'modals',
					color: Colors.red.s800,
					key: 'fandomVerifyMissingTag',
					replace: { username },
					target: interaction
				} )
			} )
			return
		} else if ( tag !== interaction.user.tag ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( {
					category: 'modals',
					color: Colors.amber.s800,
					key: 'fandomVerifyTagMismatch',
					replace: { actualTag: interaction.user.tag, expectedTag: tag, username },
					target: interaction
				} )
			} )
			return
		}

		const fandomUsers = this.container.stores.get( 'models' ).get( 'fandom-user' )
		await fandomUsers.set( interaction.user.id, username )

		const member = await getInteractionMember( interaction )
		const embed = await fandomVerify( {
			interaction,
			member,
			username
		} )
		void interaction.editReply( {
			embeds: [ embed ]
		} )
	}
}
