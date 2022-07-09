export class InteractionNotInGuild extends Error {
	public constructor() {
		super( 'Received an interaction that is supposed to be available only from guilds.' )
	}
}
