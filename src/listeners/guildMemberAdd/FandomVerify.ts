import { KeyV, FandomUsers } from '../../database'
import { ApplyOptions } from '@sapphire/decorators'
import { Constants } from 'discord.js'
import type { GuildMember } from 'discord.js'
import { Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'

@ApplyOptions<ListenerOptions>( {
	event: Constants.Events.GUILD_MEMBER_ADD
} )
export class UserEvent extends Listener<typeof Constants.Events.GUILD_MEMBER_ADD> {
	public async run( member: GuildMember ) {
		const role = await KeyV.findOne( {
			where: {
				guild: member.guild.id,
				key: 'fandom-role'
			}
		} )
		if ( !role ) return

		const fandomUser = await FandomUsers.findByPk( member.user.id )
		if ( !fandomUser ) return

		if ( fandomUser.sync ) {
			await member.roles.add(
				role.value,
				`Sincronización habilitada: ${ fandomUser.username }`
			)
				.catch( () => null )
		}
	}
}
