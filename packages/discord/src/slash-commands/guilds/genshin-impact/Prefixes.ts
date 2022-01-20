import { Colors, Guilds } from '../../../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { env } from '@sacarosa/shared'
import { Fandom } from 'mw.js'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'
import { parse } from 'mwparser'
import { SlashCommand } from '../../../framework'
import type { SlashCommandOptions } from '../../../framework'
import { SlashPermissions } from '../../../decorators'

enum PageType {
	Personaje = 'Personaje',
	Arma = 'Arma',
	Artefacto = 'Artefacto',
	Enemigo = 'Enemigo',
	Comida = 'Comida',
	Vestuario = 'Vestuario'
}

@SlashPermissions( {
	ids: [ Guilds.genshinImpact.roles.contentCreator ],
	permission: true,
	type: 'ROLE'
} )
@ApplyOptions<SlashCommandOptions>( {
	defaultPermission: false,
	description: 'Actualiza los prefijos de los objetos.',
	enabled: true,
	guilds: [ 'genshinImpact' ],
	name: 'prefijos'
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction<'present'> ): Promise<void> {
		await interaction.deferReply()
		await interaction.editReply( {
			embeds: [
				{
					color: Colors.amber[ 10 ],
					description: 'Se está realizando la tarea. Notificaré cuando haya terminado, a menos que ocurra algún error.'
				}
			]
		} )

		try {
			const fandom = new Fandom()
			const wiki = fandom.getWiki( 'es.genshin-impact' )
			const pagetypes: Array<[ string, PageType ]> = [
				[
					'Arma', PageType.Arma
				],
				[
					'Artefacto', PageType.Artefacto
				],
				[
					'Comida', PageType.Comida
				],
				[
					'Enemigo', PageType.Enemigo
				],
				[
					'Personaje jugable', PageType.Personaje
				],
				[
					'Vestuario', PageType.Vestuario
				]
			]

			const pages: Record<string, PageType> = {}
			for ( const pagetype of pagetypes ) {
				const [
					infobox, type
				] = pagetype
				const result = await this.getPagesByType( {
					infobox,
					type,
					wiki
				} )
				Object.assign( pages, result )
			}
			Object.assign( pages, await this.getArtifactPieces( wiki ) )

			const lua = format( pages )

			const bot = await fandom.login( {
				password: env.FANDOM_PASSWORD,
				username: env.FANDOM_USERNAME,
				wiki
			} )

			await bot.edit( {
				bot: true,
				text: lua,
				title: 'Module:Prefijo/datos'
			} )

			await interaction.editReply( {
				embeds: [
					{
						color: Colors.green[ 10 ],
						description: 'Tarea finalizada exitosamente.'
					}
				]
			} )
		} catch ( e ) {
			await interaction.followUp( {
				content: `<@!${ env.DISCORD_OWNER }>`,
				embeds: [
					{
						color: Colors.red[ 10 ],
						description: `Ha ocurrido un error inesperado. Vuelve a intentarlo más tarde o espera a que <@!${ env.DISCORD_OWNER }> revise los registros.`
					}
				]
			} )
		}
	}

	public async getPagesByType( { infobox, type, wiki }: { infobox: string, type: PageType, wiki: FandomWiki } ): Promise<Record<string, PageType>> {
		const generator = wiki.iterQueryProp( {
			prop: 'transcludedin',
			tilimit: 'max',
			tinamespace: 0,
			tiprop: [ 'title' ],
			titles: `Plantilla:Infobox ${ infobox }`
		} )
		const pages: string[] = []

		for await ( const template of generator ) {
			for ( const item of template.transcludedin ) {
				pages.push( item.title )
			}
		}

		return pages.reduce( ( collection, title ) => {
			collection[ title ] = type
			return collection
		}, {} as Record<string, PageType> )
	}

	public async getArtifactPieces( wiki: FandomWiki ): Promise<Record<string, PageType>> {
		const generator = wiki.iterQueryProp( {
			prop: 'transcludedin',
			tilimit: 'max',
			tinamespace: 0,
			tiprop: [ 'title' ],
			titles: 'Plantilla:Infobox Artefacto'
		} )
		const pages: string[] = []

		for await ( const template of generator ) {
			for ( const page of template.transcludedin ) {
				pages.push( page.title )
			}
		}

		const artifacts: string[] = []
		const parts = [
			'flor', 'pluma', 'arenas', 'cáliz', 'tiara'
		]

		for await ( const page of wiki.iterPages( pages ) ) {
			if ( 'missing' in page ) continue
			const { content } = page.revisions[ 0 ].slots.main
			const parsed = parse( content )
			const infobox = parsed.templates.find( t => t.name === 'Infobox Artefacto' )
			if ( !infobox ) continue

			for ( const part of parts ) {
				const piece = infobox.getParameter( part )
				if ( !piece ) continue
				artifacts.push( piece.value )
			}
		}

		return artifacts.reduce( ( collection, item ) => {
			collection[ item ] = PageType.Artefacto
			return collection
		}, {} as Record<string, PageType> )
	}
}
