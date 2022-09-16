import { container } from '@sapphire/pieces'
import { env } from '../../lib'

export interface ICommandI18n {
	description: string
	name: string
}

export const getCommand = ( { category, command, lang }: { category: string | null, command: string, lang?: string } ): ICommandI18n => {
	category ??= 'unknown'
	const key = `commands/${ category }:${ command }`
	const locale = container.i18n.getT( lang ?? env.DEFAULT_LANGUAGE )
	return locale( key, { returnObjects: true } )
}
