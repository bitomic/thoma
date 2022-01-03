import { getInteractionChannel, getWebhook, getWebhookData } from '../../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { env } from '../../lib'
import fetch from 'node-fetch'
import { getColorFromURL } from 'color-thief-node'
import { ImgurClient } from 'imgur'
import type { IWebhook } from '../../database'
import { MessageEmbed } from 'discord.js'
import { SlashCommand } from '../../framework'
import type { SlashCommandOptions } from '../../framework'
import { Webhooks } from '../../database'

const TYPES: Array<IWebhook[ 'type' ]> = [
	'channel', 'guild'
]

@ApplyOptions<SlashCommandOptions>( {
	description: 'Configura el webhook del servidor o canal.',
	enabled: true,
	name: 'webhook',
	options: [
		{
			choices: TYPES.map( type => ( {
				name: type,
				value: type
			} ) ),
			description: 'Tipo de webhook.',
			name: 'tipo',
			required: true,
			type: 'STRING'
		},
		{
			description: 'Nombre que utilizará el webhook.',
			name: 'nombre',
			required: true,
			type: 'STRING'
		},
		{
			description: 'Avatar que utilizará el webhook.',
			name: 'avatar',
			required: true,
			type: 'STRING'
		}
	]
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction ): Promise<void> {
		await interaction.deferReply( {
			ephemeral: true
		} )
		if ( !interaction.inGuild() || !interaction.memberPermissions.has( 'MANAGE_GUILD' ) ) {
			await interaction.editReply( {
				content: 'Este comando sólo puede ser usado en servidores por miembros con permiso para gestionar el servidor.'
			} )
			return
		}

		const webhookType = interaction.options.getString( 'tipo', true ) as unknown as IWebhook[ 'type' ]
		const name = interaction.options.getString( 'nombre', true )
		const avatar = interaction.options.getString( 'avatar', true )

		const req = await fetch( avatar )
		if ( !req.ok || ![
			'image/png', 'image/jpg', 'image/jpeg'
		].includes( req.headers.get( 'content-type' ) ?? 'null' ) ) {
			await interaction.editReply( {
				content: 'No he podido acceder al enlace, o el formato de la imagen es inválido.'
			} )
			return
		}
		const image = await req.buffer()
		const imgur = new ImgurClient( {
			clientId: env.IMGUR_ID
		} )
		const response = await imgur.upload( {
			image
		} )
		const result = Array.isArray( response ) ? response[ 0 ] : response

		if ( !result?.success ) {
			await interaction.editReply( {
				content: 'Ha ocurrido un error al intentar procesar la imagen. Vuelve a intentarlo.'
			} )
			return
		}


		await Webhooks.upsert( {
			avatar: result.data.link,
			name,
			snowflake: webhookType === 'channel' ? interaction.channelId : interaction.guildId,
			type: webhookType
		} )

		void interaction.editReply( {
			content: 'Acción exitosa.'
		} )

		const channel = await getInteractionChannel( interaction )
		if ( !channel ) return

		const webhook = await getWebhook( channel )

		const embed = new MessageEmbed( {
			color: parseInt( ( await getColorFromURL( avatar ) ).map( i => i.toString( 16 ) ).join( '' ), 16 ),
			description: 'Se ha actualizado la información del webhook exitosamente.'
		} )

		void webhook.send( {
			...await getWebhookData( interaction ),
			embeds: [ embed ]
		} )
	}
}
