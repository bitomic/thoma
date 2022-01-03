import type { CommandInteraction, Guild } from 'discord.js'
import { container } from '@sapphire/framework'

// eslint-disable-next-line require-await
export const getInteractionGuild = async ( interaction: CommandInteraction<'present'> ): Promise<Guild | null> => interaction.guild
		?? container.client.guilds.fetch( interaction.guildId )
