import { container } from '@sapphire/pieces'
import { env } from '../../lib'

export interface ICommandI18n {
	description: string
	name: string
}

export const getCommand = ( command: string, lang?: string ): ICommandI18n => {
	const locale = container.i18n.getT( lang ?? env.DEFAULT_LANGUAGE )
	return locale( `commands:${ command }`, { returnObjects: true } )
}
