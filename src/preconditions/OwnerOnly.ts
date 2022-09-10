import { ApplyOptions } from '@sapphire/decorators'
import { env } from '../lib'
import type { Message } from 'discord.js'
import { Precondition, type PreconditionOptions, type PreconditionResult } from '@sapphire/framework'

@ApplyOptions<PreconditionOptions>( {
	name: 'OwnerOnly'
} )
export class UserPrecondition extends Precondition {
	public run( message: Message ): PreconditionResult {
		return message.author.id === env.DISCORD_OWNER
			? this.ok()
			: this.error()
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		OwnerOnly: never
	}
}
