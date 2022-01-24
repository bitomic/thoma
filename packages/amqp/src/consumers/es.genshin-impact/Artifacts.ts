import { AMQPConsumer } from '../../lib'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'
import type { IAMQPConsumerResult } from '../../lib'
import { parse } from 'mwparser'
import { sleep } from '@bitomic/utilities'

export class Consumer extends AMQPConsumer {
	protected readonly wiki: FandomWiki

	public constructor() {
		super( {
			name: 'artifacts'
		} )
		this.wiki = this.fandom.getWiki( 'es.genshin-impact' )
	}

	public async consume(): Promise<IAMQPConsumerResult> {
		const bot = await this.getFandomBot()
		await bot.setWiki( this.wiki )
		const artifacts = await this.getArtifactPieces()
		const lua = format( artifacts )

		await bot.edit( {
			bot: true,
			text: lua,
			title: 'Module:Artefactos'
		} )

		const pieces = Object.values( artifacts ).reduce( ( collection, item ) => {
			for ( const piece of Object.values( item ) ) {
				collection.push( piece )
			}
			return collection
		}, [] as string[] )
		const exists = await this.wiki.pagesExist( pieces )

		const createdRedirects: string[] = []
		for ( const [
			artifactSet, artifactPieces
		] of Object.entries( artifacts ) ) {
			for ( const [
				_, piece
			] of Object.entries( artifactPieces ) ) {
				if ( exists[ piece ] ) continue
				await bot.edit( {
					bot: true,
					text: `#REDIRECT [[${ artifactSet }]]`,
					title: piece
				} )
				await sleep( 2000 )
				createdRedirects.push( piece )
			}
		}

		const formattedPieces = createdRedirects.map( i => `- ${ i }` )
			.join( '\n' )
		return {
			message: createdRedirects.length === 0
				? 'No fue necesario crear redirecciones.'
				: `Se crearon redirecciones para las siguientes piezas:\n${ formattedPieces }`,
			success: true
		}
	}

	public async getArtifactPieces(): Promise<Record<string, Record<string, string>>> {
		const generator = this.wiki.iterQueryProp( {
			prop: 'transcludedin',
			tilimit: 'max',
			tinamespace: 0,
			tiprop: [ 'title' ],
			titles: 'Plantilla:Infobox Artefacto'
		} )

		const artifacts: Record<string, Record<string, string>> = {}
		const parts = [
			'flor', 'pluma', 'arenas', 'cáliz', 'tiara'
		]

		const sets: string[] = []
		for await ( const template of generator ) {
			for ( const item of template.transcludedin ) {
				sets.push( item.title )
			}
		}

		for await ( const page of this.wiki.iterPages( sets ) ) {
			if ( 'missing' in page ) continue
			const { content } = page.revisions[ 0 ].slots.main
			const parsed = parse( content )
			const infobox = parsed.templates.find( t => t.name === 'Infobox Artefacto' )
			if ( !infobox ) continue

			for ( const part of parts ) {
				const piece = infobox.getParameter( part )
				if ( !piece ) continue

				const collection = artifacts[ page.title ] ?? {}
				collection[ part ] = piece.value
				if ( !artifacts[ page.title ] ) artifacts[ page.title ] = collection
			}
		}

		return artifacts
	}
}
