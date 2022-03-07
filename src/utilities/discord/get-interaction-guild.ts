import type { Guild, Interaction } from 'discord.js'
import { container } from '@sapphire/framework'

// eslint-disable-next-line require-await
export const getInteractionGuild = ( interaction: Interaction<'present'> ): Guild | Promise<Guild> => interaction.guild
		?? container.client.guilds.fetch( interaction.guildId )
