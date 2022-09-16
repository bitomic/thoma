import { resolveKey, type Target } from '@sapphire/plugin-i18next'
import type { Interaction, MessageEmbedOptions } from 'discord.js'

export const simpleEmbed = async ( options: { category: string, color: number, key: string, replace?: Record<string, unknown>, target: Target | Interaction } ): Promise<[MessageEmbedOptions]> => {
	const description = await resolveKey( options.target as Target, `command-replies/${ options.category }:${ options.key }`, options.replace )
	return [ { color: options.color, description } ]
}
