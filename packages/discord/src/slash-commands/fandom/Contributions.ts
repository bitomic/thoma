import { formatDistanceToNow, subMonths } from 'date-fns'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { es } from 'date-fns/locale'
import { Fandom } from 'mw.js'
import { getColorFromURL } from 'color-thief-node'
import { MessageEmbed } from 'discord.js'
import { SlashCommand } from '../../framework'
import type { SlashCommandOptions } from '../../framework'

@ApplyOptions<SlashCommandOptions>( {
	description: 'Obtén estadísticas de las contribuciones de un usuario en un wiki.',
	enabled: true,
	name: 'contribuciones',
	options: [
		{
			description: 'Interwiki del wiki a consultar.',
			name: 'interwiki',
			required: true,
			type: 'STRING'
		},
		{
			description: 'Nombre del usuario.',
			name: 'usuario',
			required: true,
			type: 'STRING'
		},
		{
			description: 'Fecha en formato YYYY-MM-DD.',
			name: 'fecha',
			required: false,
			type: 'STRING'
		}
	]
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction ): Promise<void> {
		if ( !this.inGuildChannel( interaction ) ) return
		await interaction.deferReply()

		const interwiki = interaction.options.getString( 'interwiki' )
		const username = interaction.options.getString( 'usuario' )
		const datestring = Date.parse( interaction.options.getString( 'fecha' ) ?? '' )
		if ( !interwiki ) {
			await interaction.editReply( 'Interwiki inválido.' )
			return
		}
		if ( !username ) {
			await interaction.editReply( 'Nombre de usuario inválido.' )
			return
		}

		const date = isNaN( datestring ) ? subMonths( Date.now(), 1 ) : new Date( datestring )

		const fandom = new Fandom()
		try {
			const wiki = fandom.getWiki( interwiki )
			const exists = await wiki.exists()

			if ( !exists ) {
				await interaction.editReply( 'El wiki no existe.' )
				return
			}

			const contributions =  await wiki.queryList( {
				list: 'usercontribs',
				ucend: date.toISOString(),
				uclimit: 'max',
				ucprop: [
					'size', 'sizediff'
				],
				ucuser: `User:${ username }`
			} )

			const count = contributions.length
			const bytes = contributions.map( i => i.size ).reduce( ( sum, val ) => sum + val, 0 )

			const embed = new MessageEmbed( {
				color: 'RANDOM',
				description: `A continuación está un resumen de las contribuciones de **${ username }** en **${ interwiki }**.`,
				fields: [
					{
						inline: true,
						name: 'Número de ediciones',
						value: new Intl.NumberFormat( 'es-MX' ).format( count )
					},
					{
						inline: true,
						name: 'Conteo de bytes',
						value: new Intl.NumberFormat( 'es-MX' ).format( bytes )
					},
					{
						inline: true,
						name: 'Periodo',
						value: formatDistanceToNow( date, {
							locale: es
						} )
					}
				],
				title: `Reporte de contribuciones - ${ username }`
			} )


			const avatar = await fandom.getUserAvatar( username )
			if ( avatar ) {
				embed.setThumbnail( avatar )
				const color = await getColorFromURL( avatar )
					.then( rgb => parseInt( rgb.map( i => i.toString( 16 ) ).join( '' ), 16 ) )
					.catch( () => null )
				if ( color ) embed.color = color
			}

			void interaction.editReply( {
				embeds: [ embed ]
			} )
		} catch ( e ) {
			this.container.logger.error( e )
			void interaction.editReply( 'Ha ocurrido un error inesperado.' )
		}
	}
}
