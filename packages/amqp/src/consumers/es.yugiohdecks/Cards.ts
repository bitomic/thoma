import { AMQPConsumer } from '../../lib'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'
import greek from 'greek-utils'
import type { IAMQPConsumerResult } from '../../lib'
import { parse } from 'mwparser'
import { sleep } from '@bitomic/utilities'
import type { Template } from 'mwparser'

export class Consumer extends AMQPConsumer {
	protected readonly wiki: FandomWiki

	public constructor() {
		super( {
			name: 'cards'
		} )
		this.wiki = this.fandom.getWiki( 'es.yugiohdecks' )
	}

	public async consume(): Promise<IAMQPConsumerResult> {
		const bot = await this.getFandomBot()
		await bot.setWiki( this.wiki )
		const cards = await this.getCardsData()

		const sorted: Record<string, Record<string, Array<string | null>>> = {}
		for ( const identifier in cards ) {
			const firstLetter = identifier.substr( 0, 1 ).toUpperCase()
			const group = /[A-Z]/.exec( firstLetter ) ? firstLetter : '7'
			if ( !( group in sorted ) ) sorted[ group ] = {}
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			sorted[ group ]![ identifier ] = cards[ identifier ]!
		}

		const keys = Object.keys( sorted ).sort()
		for ( const key of keys ) {
			const lua = format( sorted[ key ] ?? {} )
			await bot.edit( {
				bot: true,
				text: lua,
				title: `Module:RdDatos${ key }`
			} )
			await sleep( 1000 )
		}

		return {
			success: true
		}
	}

	public getIdentifier ( name: string ): Set<string> {
		const normalized = name.toUpperCase()
			.replace( /&/g, 'Y' )
			.replace( /Ñ/g, 'n' )
			.normalize( 'NFD' )
			.replace( /\p{Diacritic}/gu, '' )
			.replace( /\((legal|carta|card)\)/i, '' )
			.replace( /[:,-.°¡!'"¿?=º/·()☆«»★ ’“”#]/g, '' )
			.replace( /n/g, 'Ñ' )
		return new Set( [
			normalized, greek.toGreeklish( normalized )
		] )
	}

	public parseCard( infobox: Template ): Array<string | null> | null {
		const message = infobox.getParameter( 'mensaje' )?.value
		if ( message?.toLowerCase().includes( 'anime' ) ) return null
		const cardType = infobox.getParameter( 'carta' )?.value.toLowerCase()
		if ( !cardType ) return null
		if ( [
			'monstruo ra', 'monstruo slifer', 'monstruo obelisco', 'monstruo de sincronía oscura', 'ficha', 'carta de virus'
		].includes( cardType ) ) return null

		if ( cardType === 'carta mágica' ) {
			const attributes = [
				'inglés', 'icono', 'código'
			]
			const [
				english, icon, code
			] = attributes.map( attr => infobox.getParameter( attr )?.value )
			if ( !english || !code ) return null
			return [
				english,
				'carta mágica',
				'mágica',
				icon?.toLowerCase() || 'normal',
				code
			]
		} else if ( cardType === 'carta de trampa' ) {
			const attributes = [
				'inglés', 'icono', 'código'
			]
			const [
				english, icon, code
			] = attributes.map( attr => infobox.getParameter( attr )?.value )
			if ( !english || !code ) return null
			return [
				english,
				'carta de trampa',
				'trampa',
				icon?.toLowerCase() ?? 'normal',
				code
			]
		} else {
			const attributes = [
				'inglés', 'atributo', 'tipo', 'nivel', 'ataque', 'defensa', 'código'
			]
			const [
				english, attribute, type, level, attack, defense, _code
			] = attributes.map( attr => infobox.getParameter( attr )?.value )
			const code = _code && _code.length > 0 ? _code : null
			if ( !english || !attribute || !type || !attack ) return null
			if ( cardType === 'monstruo de enlace' ) {
				return [
					english,
					cardType,
					attribute.toLowerCase(),
					type.toLowerCase(),
					attack,
					code
				]
			} else {
				if ( !defense || !level ) return null
				return [
					english,
					cardType,
					attribute.toLowerCase(),
					type.toLowerCase(),
					level,
					attack,
					defense,
					code
				]
			}
		}
	}

	public async getCardsData(): Promise<Record<string, Array<string | null>>> {
		const wiki = this.fandom.getWiki( 'es.yugioh' )
		const cards = ( await wiki.queryProp( {
			prop: 'transcludedin',
			tilimit: 'max',
			tishow: '!redirect',
			titles: 'Plantilla:InfoboxCarta'
		} ) ).map( i => i.transcludedin.map( i => i.title ) ).flat()

		const data: Record<string, Array<string | null>> = {}

		for await ( const page of wiki.iterPages( cards ) ) {
			if ( page.missing ) continue
			const { content } = page.revisions[ 0 ].slots.main
			const parsed = parse( content )
			const infobox = parsed.findTemplate( 'Infobox Carta' ).nodes[ 0 ] ?? parsed.findTemplate( 'InfoboxCarta' ).nodes[ 0 ]
			if ( !infobox ) continue
			const cardData = this.parseCard( infobox )
			if ( cardData ) {
				const identifiers = [
					...this.getIdentifier( page.title ), ...this.getIdentifier( cardData[ 0 ] ?? page.title )
				]
				const fullData = [
					page.title, ...cardData
				]
				for ( const identifier of identifiers ) {
					data[ identifier ] = fullData
				}
			}
		}

		return data
	}
}
