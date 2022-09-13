import { resolveKey, type Target } from '@sapphire/plugin-i18next'
import type { MessageEmbedOptions } from 'discord.js'

export const simpleEmbed = async ( target: Target, color: number, file: string, key: string, replace?: Record<string, string> ): Promise<[MessageEmbedOptions]> => {
	const description = await resolveKey( target, `command-replies/${ file }:${ key }`, replace )
	return [ { color, description } ]
}
