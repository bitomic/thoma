import { DataTypes, type ModelStatic, type Model as SequelizeModel } from 'sequelize'
import type { PieceContext, PieceOptions } from '@sapphire/pieces'
import { Model } from '../framework'

interface IFandomUser {
	snowflake: string
	username: string
}

interface IFandomUserInterface extends SequelizeModel<IFandomUser, IFandomUser>, IFandomUser {
}

export class FandomUserModel extends Model<IFandomUserInterface> {
	public readonly model: ModelStatic<IFandomUserInterface>

	public constructor( context: PieceContext, options: PieceOptions ) {
		super( context, {
			...options,
			name: 'fandom-user'
		} )

		this.model = this.container.sequelize.define<IFandomUserInterface>(
			'FandomUser',
			{
				snowflake: {
					primaryKey: true,
					type: DataTypes.STRING
				},
				username: DataTypes.STRING
			},
			{
				tableName: 'FandomUsers',
				timestamps: false
			}
		)
	}

	public async set( snowflake: string, username: string ): Promise<void> {
		await this.model.upsert(
			{ snowflake, username },
		)
	}

	public async get( snowflake: string ): Promise<string | null> {
		const result = await this.model.findOne( { where: { snowflake } } )
		return result?.getDataValue( 'username' ) ?? null
	}
}

declare global {
	interface ModelRegistryEntries {
		'fandom-user': FandomUserModel
	}
}
