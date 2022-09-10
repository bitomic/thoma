import { fandomVerify, getInteractionMember } from '../../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import { Constants, type ModalSubmitInteraction } from 'discord.js'
import { Fandom } from 'mw.js'
import { Listener, type ListenerOptions } from '@sapphire/framework'

@ApplyOptions<ListenerOptions>( {
	event: Constants.Events.INTERACTION_CREATE,
	name: 'ModalFandomVerify'
} )
export class UserEvent extends Listener {
	public async run( interaction: ModalSubmitInteraction ): Promise<void> {
		if ( !interaction.isModalSubmit() || interaction.customId !== 'fandom-verify' || !interaction.inGuild() ) return
		await interaction.deferReply( { ephemeral: true } )

		const username = interaction.fields.getTextInputValue( 'username' )
		const tag = await new Fandom().getUserDiscordTag( username )

		if ( !tag ) {
			void interaction.editReply( {
				content: `La cuenta de **${ username }** en Fandom no tiene asociado un tag de Discord.`
			} )
			return
		} else if ( tag !== interaction.user.tag ) {
			void interaction.editReply( {
				content: `La información no coincide. La cuenta de **${ username }** tiene asociado el tag **${ tag }**, mientras que tu tag actual es **${ interaction.user.tag }**.`
			} )
			return
		}

		const fandomUsers = this.container.stores.get( 'models' ).get( 'fandom-user' )
		await fandomUsers.set( interaction.user.id, username )

		const member = await getInteractionMember( interaction )
		const embed = await fandomVerify( {
			guildId: interaction.guildId,
			member,
			username
		} )
		void interaction.editReply( {
			embeds: [ embed ]
		} )
	}
}
