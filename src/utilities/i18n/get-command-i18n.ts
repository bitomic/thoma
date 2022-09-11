import { container } from '@sapphire/pieces'
import type { TFunction } from '@sapphire/plugin-i18next'
import { env } from '../../lib'
import type { Language } from '../constants'
import type { ICommandI18n } from './get-command'

export const getCommandI18n = ( category: string | null, command: string, property: 'name' | 'description', namespace: 'commands' | 'commands-options' = 'commands' ): Partial<Record<Language, string>> => {
	category = category ? `${ category }.` : ''
	const key = `${ namespace }:${ category }${ command }`

	const languages = new Map( container.i18n.languages ) as Map<Language, TFunction>
	languages.delete( env.DEFAULT_LANGUAGE as Language )

	const data: Partial<Record<Language, string>> = {}
	for ( const [ language, fetch ] of languages ) {
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		const result = fetch( key, { returnObjects: true } ) as ICommandI18n | null
		const value = result?.[ property ]
		if ( value ) data[ language ] = value
	}

	return data
}
