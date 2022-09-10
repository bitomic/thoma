import { DataTypes, type ModelStatic, type Optional, type Model as SequelizeModel } from 'sequelize'
import type { PieceContext, PieceOptions } from '@sapphire/pieces'
import { Model } from '../framework'

interface IStubGroup {
	channel: string
	guild: string
	id: number
	wiki: string
}

interface IStubGroupInterface extends SequelizeModel<IStubGroup, Optional<IStubGroup, 'id'>>, IStubGroup {
}

export class StubGroupModel extends Model<IStubGroupInterface> {
	public readonly model: ModelStatic<IStubGroupInterface>

	public constructor( context: PieceContext, options: PieceOptions ) {
		super( context, {
			...options,
			name: 'stubgroups'
		} )

		this.model = this.container.sequelize.define<IStubGroupInterface>(
			'StubGroup',
			{
				channel: DataTypes.STRING,
				guild: DataTypes.STRING,
				id: {
					allowNull: false,
					autoIncrement: true,
					primaryKey: true,
					type: DataTypes.INTEGER
				},
				wiki: DataTypes.STRING
			},
			{
				tableName: 'StubGroups',
				timestamps: false
			}
		)
	}

	public async assert( guild: string, channel: string, wiki: string ): Promise<number> {
		const exists = await this.model.findOne( { where: { channel, guild, wiki } } )
		if ( exists ) return exists.id

		const created = await this.model.create( { channel, guild, wiki } )
		return created.id
	}
}

declare global {
	interface ModelRegistryEntries {
		stubgroups: StubGroupModel
	}
}
