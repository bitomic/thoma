import { Colors, getInteractionChannel, Guilds } from '../../../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { env } from '../../../lib'
import { Fandom } from 'mw.js'
import type { FandomWiki } from 'mw.js'
import fetch from 'node-fetch'
import { SlashCommand } from '../../../framework'
import type { SlashCommandOptions } from '../../../framework'
import { SlashPermissions } from '../../../decorators'

@SlashPermissions( {
	ids: [ Guilds.genshinImpact.roles.contentCreator ],
	permission: true,
	type: 'ROLE'
} )
@ApplyOptions<SlashCommandOptions>( {
	defaultPermission: false,
	description: 'Sube las imágenes de objetos faltantes.',
	enabled: true,
	guilds: [ 'genshinImpact' ],
	name: 'imágenes',
	options: [
		{
			choices: [
				{
					name: 'Objetos',
					value: 'Objeto'
				},
				{
					name: 'Decoraciones',
					value: 'Decoración'
				}
			],
			description: 'Tipo de objetos a revisar.',
			name: 'tipo',
			required: true,
			type: 'STRING'
		},
		{
			description: 'Mostrar omisiones.',
			name: 'omisiones',
			type: 'BOOLEAN'
		}
	]
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction<'present'> ): Promise<void> {
		await interaction.reply( {
			embeds: [
				{
					color: Colors.amber[ 10 ],
					description: 'Revisando imágenes faltantes. Comenzaré un hilo para informar de mi progreso.'
				}
			]
		} )
		const channel = await getInteractionChannel( interaction )
		const thread = await channel?.threads.create( {
			name: `Sacarosa @ ${ Date.now() }`
		} )
		if ( !thread ) {
			await interaction.editReply( {
				embeds: [
					{
						color: Colors.red[ 10 ],
						description: 'No he podido crear un hilo en este canal, por lo que he cancelado la tarea.'
					}
				]
			} )
			return
		}

		const fandom = new Fandom()
		const wikis = {
			en: fandom.getWiki( 'genshin-impact' ),
			es: fandom.getWiki( 'es.genshin-impact' )
		}

		const generator = wikis.es.iterQueryProp( {
			prop: 'transcludedin',
			tilimit: 'max',
			tiprop: [ 'title' ],
			titles: `Plantilla:Infobox ${ interaction.options.getString( 'tipo', true ) }`
		} )
		const itemNames: string[] = []
		for await ( const template of generator ) {
			for ( const item of template.transcludedin ) {
				itemNames.push( item.title )
			}
		}
		const items = itemNames.reduce( ( collection, title ) => {
			const image = `Archivo:Objeto ${ title.replace( /: /g, ' - ' ) }.png`
			collection[ image ] = title
			return collection
		}, {} as Record<string, string> )
		const englishTitles = await this.interwikiTranslate( {
			sourceWiki: wikis.es,
			targetLanguage: 'en',
			titles: Object.values( items )
		} )
		const exists = await wikis.es.pagesExist( Object.keys( items ) )

		const bot = await fandom.login( {
			password: env.FANDOM_PASSWORD,
			username: env.FANDOM_USERNAME,
			wiki: wikis.es
		} )

		const showOmits = interaction.options.getBoolean( 'omisiones' )
		let i = 0
		const count = Object.keys( englishTitles ).length
		for ( const [
			spanish, english
		] of Object.entries( englishTitles ) ) {
			i++

			const spanishImage = `Objeto ${ spanish.replace( /: /g, ' - ' ) }.png`
			if ( exists[ `Archivo:${ spanishImage }` ] ) continue

			const englishImage = `Item ${ english.replace( /":/g, '' ) }.png`
			const imageUrl = `https://genshin-impact.fandom.com/wiki/Special:Filepath/${ encodeURIComponent( englishImage ) }`

			const req = await fetch( imageUrl, {
				method: 'HEAD'
			} )
			if ( !req.ok || spanishImage.search( '"' ) !== -1 ) {
				if ( showOmits ) {
					await thread.send( {
						embeds: [
							{
								color: Colors.amber[ 10 ],
								fields: [
									{
										inline: true,
										name: 'Título en español',
										value: spanish
									},
									{
										inline: true,
										name: 'Título en inglés',
										value: english
									}
								],
								footer: {
									text: `Progreso actual: ${ i } / ${ count }`
								},
								title: 'Omitiendo objeto'
							}
						]
					} )
				}
				continue
			}

			const status = await bot.uploadFromUrl( {
				filename: spanishImage,
				url: `${ req.url }&format=png`
			} ).catch( () => null )

			if ( status ) {
				await thread.send( {
					embeds: [
						{
							color: Colors.green[ 10 ],
							fields: [
								{
									name: 'Título en español',
									value: spanish
								},
								{
									name: 'Título en inglés',
									value: english
								}
							],
							footer: {
								text: `Progreso actual: ${ i } / ${ count }`
							},
							thumbnail: {
								url: `${ req.url }&format=png`
							},
							title: 'Imagen subida'
						}
					]
				} )
			} else {
				await thread.send( {
					embeds: [
						{
							color: Colors.red[ 10 ],
							fields: [
								{
									inline: true,
									name: 'Título en español',
									value: spanish
								},
								{
									inline: true,
									name: 'Título en inglés',
									value: english
								}
							],
							footer: {
								text: `Progreso actual: ${ i } / ${ count }`
							},
							title: 'Imagen no subida'
						}
					]
				} )
			}
		}

		await thread.send( {
			embeds: [
				{
					color: Colors.green[ 10 ],
					description: 'Tarea finalizada.'
				}
			]
		} )
		await thread.setArchived( true )
			.catch( () => null )
	}

	private async interwikiTranslate( { sourceWiki, titles, targetLanguage }: { sourceWiki: FandomWiki, titles: string | string[], targetLanguage: string } ): Promise<Record<string, string>> {
		const interwikis: Record<string, string> = {}

		if ( typeof titles === 'string' ) {
			titles = [ titles ]
		}

		while ( titles.length !== 0 ) {
			const res = await sourceWiki.get<{
				query: {
					pages: Array<{
						langlinks?: Array<{
							lang: string
							title: string
						}>
						missing?: boolean
						title: string
					}>
				}
			}>( {
				action: 'query',
				format: 'json',
				lllang: targetLanguage,
				lllimit: 'max',
				prop: 'langlinks',
				titles: titles.splice( 0, 25 ).join( '|' )
			} )

			for ( const page of res.query.pages ) {
				const interwikiName: string | undefined = page.missing === true
					? undefined
					: page.langlinks?.find( i => i.lang === targetLanguage )?.title
				if ( interwikiName ) {
					interwikis[ page.title ] = interwikiName
				}
			}
		}

		return interwikis
	}
}
