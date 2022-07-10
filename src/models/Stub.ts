import type { ModelStatic, Model as SequelizeModel } from 'sequelize'
import type { PieceContext, PieceOptions } from '@sapphire/pieces'
import { DataTypes } from 'sequelize'
import { Model } from '../framework'

export interface IStub {
	group: number
	pageid: number
	reviewedBy?: string
	reviewedDate?: Date
	title: string
}

interface IStubInterface extends SequelizeModel<IStub, IStub>, IStub {
}

export class StubModel extends Model<IStubInterface> {
	public readonly model: ModelStatic<IStubInterface>

	public constructor( context: PieceContext, options: PieceOptions ) {
		super( context, {
			...options,
			name: 'stubs'
		} )

		this.model = this.container.sequelize.define<IStubInterface>(
			'Stub',
			{
				group: {
					primaryKey: true,
					type: DataTypes.INTEGER
				},
				pageid: {
					primaryKey: true,
					type: DataTypes.INTEGER
				},
				reviewedBy: {
					allowNull: true,
					type: DataTypes.STRING
				},
				reviewedDate: {
					allowNull: true,
					type: DataTypes.DATE
				},
				title: DataTypes.STRING
			},
			{
				tableName: 'Stubs',
				timestamps: false
			}
		)
	}
}

declare global {
	interface ModelRegistryEntries {
		stubs: StubModel
	}
}
