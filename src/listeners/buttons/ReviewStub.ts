import { Constants, Message } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
import { getInteractionChannel } from '../../utilities'
import type { Interaction } from 'discord.js'
import { Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'

@ApplyOptions<ListenerOptions>( {
	event: Constants.Events.INTERACTION_CREATE,
	name: 'ButtonReviewStub'
	} )
export class UserEvent extends Listener {
	public async run( interaction: Interaction ): Promise<void> {
		if ( !interaction.isButton() || interaction.customId !== 'review-stub' || !interaction.inGuild() ) return

		await interaction.deferReply( { ephemeral: true } )
		const channel = await getInteractionChannel( interaction )
		if ( !channel || channel.type !== 'GUILD_TEXT' ) {
			void interaction.editReply( 'Ha ocurrido un error inesperado.' )
			return
		}

		const [ embed ] = interaction.message.embeds
		if ( !embed ) {
			void interaction.editReply( 'Parece que el embed fue eliminado...' )
			return
		}

		const threads = await channel.threads.fetch()
		const logThread = threads.threads.find( t => t.ownerId === this.container.client.id )
		if ( !logThread ) {
			void interaction.editReply( 'No he podido encontrar el hilo de registros.' )
			return
		}

		try {
			await logThread.send( {
				embeds: [ {
					author: {
						icon_url: interaction.user.avatarURL( { format: 'png' } ) ?? '',
						name: interaction.user.tag
					},
					color: 0x0276aa,
					description: `<@!${ interaction.user.id }> marcó como revisado **[${ embed.title ?? '' }](${ embed.url ?? '' })**.`
				} ]
			} )
			const message = interaction.message instanceof Message
				? interaction.message
				: await channel.messages.fetch( interaction.message.id )
			await message.delete()
			await this.container.stores.get( 'models' ).get( 'stubs' ).model.update(
				{ reviewedBy: interaction.user.id, reviewedDate: new Date() },
				{ where: { title: embed.title ?? '' } } // todo: make it better
			)
		} catch ( e ) {
			this.container.logger.error( e )
		}

		void interaction.editReply( '¡Se ha marcado como revisado exitosamente!' )
	}
}
