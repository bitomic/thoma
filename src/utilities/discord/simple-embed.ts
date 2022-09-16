import { resolveKey, type Target } from '@sapphire/plugin-i18next'
import type { Interaction, MessageEmbedOptions } from 'discord.js'

export const simpleEmbed = async ( target: Target | Interaction<'cached' | 'raw'>, color: number, file: string, key: string, replace?: Record<string, string> ): Promise<[MessageEmbedOptions]> => {
	const description = await resolveKey( target as Target, `command-replies/${ file }:${ key }`, replace )
	return [ { color, description } ]
}
