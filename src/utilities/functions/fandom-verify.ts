import { ChannelTypes, RoleTypes } from '../constants'
import type { GuildMember, MessageEmbedOptions } from 'discord.js'
import { container } from '@sapphire/framework'

export const fandomVerify = async ( { guildId, member, username }: { guildId: string, member: GuildMember, username: string } ): Promise<MessageEmbedOptions> => {
	const roles = container.stores.get( 'models' ).get( 'roles' )
	const fandomRole = await roles.get( guildId, RoleTypes.Fandom )
	if ( !fandomRole ) {
		return {
			color: 'YELLOW',
			description: 'Este servidor no tiene configurado un rol para usuarios verificados con su cuenta de Fandom.'
		}
	}

	if ( member.roles.cache.has( fandomRole ) ) {
		return {
			color: 'YELLOW',
			description: `Ya te habías verificado anteriormente y tienes el rol de <@&${ fandomRole }>.`
		}
	}

	try {
		await member.roles.add( fandomRole )

		const logsChannelId = await container.stores.get( 'models' ).get( 'channels' )
			.get( guildId, ChannelTypes.Logs )
		if ( logsChannelId ) {
			const guild = await container.client.guilds.fetch( guildId )
			const channel = await guild.channels.fetch( logsChannelId )
			if ( channel && channel.type === 'GUILD_TEXT' ) {
				void channel.send( {
					content: `:ballot_box_with_check:  <@!${ member.user.id }> (${ member.user.tag }) acaba de verificarse con su cuenta de Fandom: **${ username }**`
				} )
			}
		}

		return {
			color: 'DARK_RED',
			description: `Te has verificado exitosamente y se te ha asignado el rol <@&${ fandomRole }>.`
		}
	} catch {
		return {
			color: 'RED',
			description: 'Ha ocurrido un error inesperado.\nVuelve a intentarlo en unos segundos; si el problema persiste, contacta con un administrador.'
		}
	}
}
