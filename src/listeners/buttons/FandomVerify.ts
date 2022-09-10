import { fandomVerify, getInteractionMember } from '../../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import { Constants } from 'discord.js'
import type { Interaction } from 'discord.js'
import { Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'
import { Modal } from 'discord.js'

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
				member,
				username: alreadyExists
			} )
			await interaction.editReply( { embeds: [ embed ] } )
		} else {
			const modal = new Modal( {
				components: [ {
					components: [ {
						customId: 'username',
						label: 'Nombre de usuario',
						required: true,
						style: 'SHORT',
						type: 'TEXT_INPUT'
					} ],
					type: 'ACTION_ROW'
				} ],
				customId: 'fandom-verify',
				title: 'Verifícate usando tu cuenta de Fandom'
			} )
			await interaction.showModal( modal )
		}
	}
}
