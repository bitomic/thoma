import { ChannelTypes, RoleTypes } from '../constants'
import type { GuildMember, Interaction, MessageEmbedOptions } from 'discord.js'
import { container } from '@sapphire/framework'
import { simpleEmbed } from '../discord'
import Colors from '@bitomic/material-colors'

export const fandomVerify = async ( { interaction, member, username }: { interaction: Interaction<'cached' | 'raw'>, member: GuildMember, username: string } ): Promise<MessageEmbedOptions> => {
	const roles = container.stores.get( 'models' ).get( 'roles' )
	const fandomRole = await roles.get( interaction.guildId, RoleTypes.Fandom )
	if ( !fandomRole ) {
		return ( await simpleEmbed( interaction, Colors.amber.s800, 'modals', 'fandomVerifyNoRole' ) )[ 0 ]
	}

	if ( member.roles.cache.has( fandomRole ) ) {
		return ( await simpleEmbed( interaction, Colors.amber.s800, 'modals', 'fandomVerifyAlreadyVerified', { role: fandomRole } ) )[ 0 ]
	}

	await member.roles.add( fandomRole )

	const logsChannelId = await container.stores.get( 'models' ).get( 'channels' )
		.get( interaction.guildId, ChannelTypes.Logs )
	if ( logsChannelId ) {
		const guild = await container.client.guilds.fetch( interaction.guildId )
		const channel = await guild.channels.fetch( logsChannelId )
		if ( channel && channel.type === 'GUILD_TEXT' ) {
			void channel.send( {
				embeds: await simpleEmbed( channel, Colors.green.s800, 'modals', 'fandomVerifyLogEntry', {
					tag: interaction.user.tag,
					userId: interaction.user.id,
					username
				} )
			} )
		}
	}

	return ( await simpleEmbed( interaction, Colors.green.s800, 'modals', 'fandomVerifySuccess', { role: fandomRole } ) )[ 0 ]
}
