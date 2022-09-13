export class NoMessageFromInteraction extends Error {
	public constructor() {
		super( 'Couldn\'t retrieve a message from a provided interaction.' )
	}
}
