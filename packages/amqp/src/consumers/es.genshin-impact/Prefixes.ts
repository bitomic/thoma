import { AMQPConsumer } from '../../lib'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'
import type { IAMQPConsumerResult } from '../../lib'
import { parse } from 'mwparser'

enum PageType {
	Personaje = 'Personaje',
	Arma = 'Arma',
	Artefacto = 'Artefacto',
	Enemigo = 'Enemigo',
	Comida = 'Comida',
	Vestuario = 'Vestuario'
}

export class Consumer extends AMQPConsumer {
	protected readonly wiki: FandomWiki

	public constructor() {
		super( {
			name: 'prefixes'
		} )
		this.wiki = this.fandom.getWiki( 'es.genshin-impact' )
	}

	public async consume(): Promise<IAMQPConsumerResult> {
		const bot = await this.getFandomBot()
		await bot.setWiki( this.wiki )
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
				type
			} )
			Object.assign( pages, result )
		}
		Object.assign( pages, await this.getArtifactPieces() )

		const lua = format( pages )
		await bot.edit( {
			bot: true,
			text: lua,
			title: 'Module:Prefijo/datos'
		} )

		return {
			success: true
		}
	}

	public async getPagesByType( { infobox, type }: { infobox: string, type: PageType } ): Promise<Record<string, PageType>> {
		const generator = this.wiki.iterQueryProp( {
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

	public async getArtifactPieces(): Promise<Record<string, PageType>> {
		const generator = this.wiki.iterQueryProp( {
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

		for await ( const page of this.wiki.iterPages( pages ) ) {
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
