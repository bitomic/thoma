import { Store } from '@sapphire/pieces'
import { UserCommand } from './UserCommand'

export class UserCommandStore extends Store<UserCommand> {
	public constructor() {
		// @ts-expect-error - Either expect-error or cast to any: https://github.com/sapphiredev/framework/blob/db6febd56afeaeff1f23afce2a269beecb316804/src/lib/structures/CommandStore.ts#L10
		super( UserCommand, { name: 'user-commands' } )
	}
}

declare module '@sapphire/pieces' {
	interface StoreRegistryEntries {
		'user-commands': UserCommandStore
	}
}
