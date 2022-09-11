import { container } from '@sapphire/pieces'
import { env } from '../../lib'

export interface ICommandI18n {
	description: string
	name: string
}

export const getCommand = ( category: string | null, command: string, lang?: string, namespace: 'commands' | 'commands-options' = 'commands' ): ICommandI18n => {
	category = category ? `${ category }.` : ''
	const locale = container.i18n.getT( lang ?? env.DEFAULT_LANGUAGE )
	return locale( `${ namespace }:${ category }${ command }`, { returnObjects: true } )
}
