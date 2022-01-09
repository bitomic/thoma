import type { UserApplicationCommandData, UserContextMenuInteraction } from 'discord.js'
import type { Awaitable } from '@sapphire/utilities'
import { Guilds } from '../utilities'
import { Piece } from '@sapphire/framework'
import type { PieceContext } from '@sapphire/framework'

export abstract class UserCommand extends Piece {
	public readonly commandData: UserCommandOptions & { type: 'USER' }
	public readonly guilds: string[]

	public constructor( context: PieceContext, options: UserCommandOptions ) {
		super( context, options )

		this.commandData = {
			name: options.name,
			type: 'USER'
		}

		this.guilds = ( options.guilds || [] ).map( i => Guilds[ i ] )
	}

	public abstract run( interaction: UserContextMenuInteraction ): Awaitable<unknown>
}

export type UserCommandOptions = Omit<UserApplicationCommandData, 'type'> & {
	enabled?: boolean
	guilds?: Array<keyof typeof Guilds>
}

export type FullUserCommandOptions = UserApplicationCommandData & UserCommandOptions
