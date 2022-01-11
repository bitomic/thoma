import { createClassDecorator, createProxy } from '@sapphire/decorators'
import type { ApplicationCommandPermissionData } from 'discord.js'
import type { Ctor } from '@sapphire/utilities'
import type { SlashCommand } from '../framework'

interface ISlashAllowOptions {
	ids: `${ number }` | Array<`${ number }`>
	permission: boolean
	type: 'ROLE' | 'USER'
}

export function SlashPermissions( { ids, permission, type }: ISlashAllowOptions ): ClassDecorator {
	ids = Array.isArray( ids ) ? ids : [ ids ]
	const permissions: ApplicationCommandPermissionData[] = ids.map( id => ( {
		id,
		permission,
		type
	} ) )

	return createClassDecorator( ( target: Ctor<ConstructorParameters<typeof SlashCommand>, SlashCommand> ) =>
		createProxy( target, {
			construct: ( ctor, [
				context, baseOptions = {}
			] ) =>
				// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
				new ctor( context, {
					...baseOptions,
					permissions
				} )
		} )
	)
}
