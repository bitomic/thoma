import { container } from '@sapphire/pieces'
import type { TFunction } from '@sapphire/plugin-i18next'
import { env } from '../../lib'
import type { Language } from '../constants'

export const getCommandI18n = ( category: string | null, command: string, property: 'name' | 'description' ): Partial<Record<Language, string>> => {
	category ??= 'unknown'
	const key = `commands/${ category }:${ command }.${ property }`

	const languages = new Map( container.i18n.languages ) as Map<Language, TFunction>
	languages.delete( env.DEFAULT_LANGUAGE as Language )

	const data: Partial<Record<Language, string>> = {}
	for ( const [ language, fetch ] of languages ) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		const result = fetch( key )
		data[ language ] = result
	}

	return data
}
