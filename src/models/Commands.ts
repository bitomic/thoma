import { type ApplicationCommandRegistry, RegisterBehavior } from '@sapphire/framework'
import { DataTypes, type ModelStatic, type Model as SequelizeModel } from 'sequelize'
import type { PieceContext, PieceOptions } from '@sapphire/pieces'
import { env } from '../lib'
import { Model } from '../framework'

interface ICommand {
	entryType: 'guild' | 'idHint'
	name: string
	value: string
}

interface ICommandInterface extends SequelizeModel<ICommand, ICommand>, ICommand {
}

export class CommandModel extends Model<ICommandInterface> {
	public readonly model: ModelStatic<ICommandInterface>

	public constructor( context: PieceContext, options: PieceOptions ) {
		super( context, {
			...options,
			name: 'commands'
		} )

		this.model = this.container.sequelize.define<ICommandInterface>(
			'Command',
			{
				entryType: DataTypes.STRING,
				name: DataTypes.STRING,
				value: DataTypes.STRING
			},
			{
				tableName: 'Commands',
				timestamps: false
			}
		)
	}

	public async addIdHint( command: string, idHint: string ): Promise<boolean | null> {
		const options = { entryType: 'idHint', name: command, value: idHint } as const
		const exists = await this.model.findOne( { where: options } )
		if ( exists ) return false
		return this.model.upsert( options )
			.then( response => response[ 1 ] )
	}

	public async addGuild( command: string, guild: string ): Promise<boolean | null> {
		const options = { entryType: 'guild', name: command, value: guild } as const
		const exists = await this.model.findOne( { where: options } )
		if ( exists ) return false
		return this.model.upsert( { entryType: 'guild', name: command, value: guild } )
			.then( response => response[ 1 ] )
	}

	public async getData( command: string ): Promise<ApplicationCommandRegistry.RegisterOptions> {
		const rows = await this.model.findAll( { where: { name: command } } )
		const data: ApplicationCommandRegistry.RegisterOptions = {
			behaviorWhenNotIdentical: RegisterBehavior.Overwrite
		}
		if ( env.NODE_ENV === 'development' ) {
			data.guildIds = [ env.DISCORD_DEVELOPMENT_SERVER ]
		}

		rows.reduce( ( collection, item ) => {
			if ( item.entryType === 'guild' ) {
				const guilds = collection.guildIds ?? []
				guilds.push( item.value )
				collection.guildIds ??= guilds
			} else {
				const hints = collection.idHints ?? []
				hints.push( item.value )
				collection.idHints ??= hints
			}
			return collection
		}, data )
		return data
	}

	public removeGuild( command: string, guild: string ): Promise<number> {
		return this.model.destroy( { where: { entryType: 'guild', name: command, value: guild } } )
	}

	public truncate(): Promise<void> {
		return this.model.truncate()
	}
}

declare global {
	interface ModelRegistryEntries {
		commands: CommandModel
	}
}
