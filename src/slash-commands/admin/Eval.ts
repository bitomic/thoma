import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { Constants } from 'discord.js'
import { env } from '../../lib'
import { getInteractionChannel } from '../../utilities'
import { SlashCommand } from '../../framework'
import type { SlashCommandOptions } from '../../framework'
import { SlashPermissions } from '../../decorators'

@SlashPermissions( {
	ids: env.DISCORD_OWNER as `${ number }`,
	permission: true,
	type: 'USER'
} )
@ApplyOptions<SlashCommandOptions>( {
	defaultPermission: false,
	description: 'Evalúa el código en un mensaje.',
	enabled: true,
	name: 'eval',
	options: [
		{
			description: 'Identificador del mensaje',
			name: 'mensaje',
			required: true,
			type: 'STRING'
		}
	]
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction<'present'> ): Promise<void> {
		// You're never sure enough
		if ( interaction.user.id !== env.DISCORD_OWNER ) return
		const channel = await getInteractionChannel( interaction )
		if ( !channel ) return
		const messageId = interaction.options.getString( 'mensaje', true )
		const message = await channel.messages.fetch( messageId )
			.catch( () => null )

		if ( !message ) {
			await interaction.reply( {
				content: 'No puedo ver el mensaje proporcionado.',
				ephemeral: true
			} )
			return
		}

		this.container.client.emit( Constants.Events.MESSAGE_CREATE, message )
		await interaction.reply( {
			content: 'Recibido.',
			ephemeral: true
		} )
	}
}
