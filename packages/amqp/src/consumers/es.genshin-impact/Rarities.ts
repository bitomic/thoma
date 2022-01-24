import { AMQPConsumer } from '../../lib'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'
import { parse } from 'mwparser'

export class Consumer extends AMQPConsumer {
	protected readonly wiki: FandomWiki

	public constructor() {
		super( {
			name: 'rarities'
		} )
		this.wiki = this.fandom.getWiki( 'es.genshin-impact' )
	}

	public async consume(): Promise<boolean> {
		const bot = await this.getFandomBot()
		await bot.setWiki( this.wiki )
		const rarities = await this.getRarities()
		const lua = format( rarities )
		await bot.edit( {
			bot: true,
			text: lua,
			title: 'Module:Rarezas'
		} )

		return true
	}

	protected async getPages(): Promise<string[]> {
		const pages: string[] = []
		const templates = [
			'Plantilla:Infobox Arma',
			'Plantilla:Infobox Comida',
			'Plantilla:Infobox Objeto',
			'Plantilla:Infobox Personaje jugable'
		]

		for ( const template of templates ) {
			const generator = this.wiki.iterQueryProp( {
				prop: 'transcludedin',
				tilimit: 'max',
				tinamespace: 0,
				tiprop: [ 'title' ],
				titles: template
			} )
			for await ( const tmp of generator ) {
				for ( const page of tmp.transcludedin ) {
					pages.push( page.title )
				}
			}
		}

		return pages
	}

	public async getRarities(): Promise<Record<string, number>> {
		const titles = await this.getPages()
		const rarities: Record<string, number> = {}

		for await ( const page of this.wiki.iterPages( titles ) ) {
			if ( 'missing' in page ) continue
			const { content } = page.revisions[ 0 ].slots.main
			const parsed = parse( content )
			const infoboxName = parsed.templates.map( t => t.name ).find( t => t.startsWith( 'Infobox' ) )
			if ( !infoboxName ) continue
			const [ infobox ] = parsed.findTemplate( infoboxName ).nodes
			if ( !infobox ) continue
			const rarity = Number( infobox.getParameter( 'rareza' )?.value )
			if ( isNaN( rarity ) ) continue
			rarities[ page.title ] = rarity
		}

		return rarities
	}
}
