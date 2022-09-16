import { ChannelTypes, RoleTypes } from '../constants'
import type { GuildMember, Interaction, MessageEmbedOptions } from 'discord.js'
import { container } from '@sapphire/framework'
import Colors from '@bitomic/material-colors'
import { simpleEmbed } from '../discord'
import type { Target } from '@sapphire/plugin-i18next'

export const fandomVerify = async ( { interaction, member, username }: { interaction: Interaction<'cached' | 'raw'>, member: GuildMember, username: string } ): Promise<MessageEmbedOptions> => {
	const roles = container.stores.get( 'models' ).get( 'roles' )
	const fandomRole = await roles.get( interaction.guildId, RoleTypes.Fandom )
	if ( !fandomRole ) {
		const embeds = await simpleEmbed( {
			category: 'modals',
			color: Colors.amber.s800,
			key: 'fandomVerifyNoRole',
			target: interaction as Target
		} )
		return embeds[ 0 ]
	}

	if ( member.roles.cache.has( fandomRole ) ) {
		const embeds = await simpleEmbed( {
			category: 'modals',
			color: Colors.amber.s800,
			key: 'fandomVerifyAlreadyVerified',
			replace: { role: fandomRole },
			target: interaction as Target
		} )
		return embeds[ 0 ]
	}

	await member.roles.add( fandomRole )

	const logsChannelId = await container.stores.get( 'models' ).get( 'channels' )
		.get( interaction.guildId, ChannelTypes.Logs )
	if ( logsChannelId ) {
		const guild = await container.client.guilds.fetch( interaction.guildId )
		const channel = await guild.channels.fetch( logsChannelId )
		if ( channel && channel.type === 'GUILD_TEXT' ) {
			void channel.send( {
				embeds: await simpleEmbed( {
					category: 'modals',
					color: Colors.green.s800,
					key: 'fandomVerifyLogEntry',
					replace: {
						tag: interaction.user.tag,
						userId: interaction.user.id,
						username
					},
					target: interaction as Target
				} )
			} )
		}
	}

	const embeds = await simpleEmbed( {
		category: 'modals',
		color: Colors.green.s800,
		key: 'fandomVerifySuccess',
		replace: { role: fandomRole },
		target: interaction as Target
	} )
	return embeds[ 0 ]
}
