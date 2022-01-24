import type { AMQPConsumer } from './AMQPConsumer'
import fs from 'fs'
import path from 'path'

export interface IStoreOptions {
	path: string
}

export class Store {
	protected readonly collection = new Map<string, AMQPConsumer>()
	protected readonly path: string

	public constructor( options: IStoreOptions ) {
		this.path = options.path
	}

	public get( key: string ): AMQPConsumer | undefined {
		return this.collection.get( key )
	}

	public async load(): Promise<void> {
		await this.loadDirectory( this.path )
	}

	private async loadDirectory( dirpath: string ): Promise<void> {
		for ( const name of fs.readdirSync( dirpath ) ) {
			const filepath = path.resolve( dirpath, name )
			const lstat = fs.lstatSync( filepath )
			if ( lstat.isFile() ) {
				if ( !name.endsWith( '.js' ) ) continue
				await this.loadFile( filepath )
			} else if ( lstat.isDirectory() ) {
				await this.loadDirectory( filepath )
			}
		}
	}

	private async loadFile( filepath: string ): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
		const [ consumerCtor ] = Object.values( await import( filepath ) ) as [ typeof AMQPConsumer ]
		// @ts-expect-error - trust me, it is a consumer constructor
		const consumer: AMQPConsumer = new consumerCtor() //eslint-disable-line @typescript-eslint/no-unsafe-assignment
		this.collection.set( consumer.name, consumer )
	}
}
