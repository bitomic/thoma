import type { ModelStatic, Model as SequelizeModel } from 'sequelize'
import type { PieceContext, PieceOptions } from '@sapphire/pieces'
import { DataTypes } from 'sequelize'
import { Model } from '../framework'
import type { RoleTypes } from '../utilities'

interface IRole {
	guild: string
	role: string
	type: RoleTypes
}

interface IRoleInterface extends SequelizeModel<IRole, IRole>, IRole {
}

export class RoleModel extends Model<IRoleInterface> {
	public readonly model: ModelStatic<IRoleInterface>

	public constructor( context: PieceContext, options: PieceOptions ) {
		super( context, {
			...options,
			name: 'roles'
		} )

		this.model = this.container.sequelize.define<IRoleInterface>(
			'KeyV',
			{
				guild: {
					primaryKey: true,
					type: DataTypes.STRING
				},
				role: {
					primaryKey: true,
					type: DataTypes.STRING
				},
				type: DataTypes.STRING
			},
			{
				tableName: 'Roles',
				timestamps: false
			}
		)
	}

	public async set( { guild, role, type }: { guild: string, role: string, type: RoleTypes } ): Promise<void> {
		await this.model.upsert(
			{ guild, role, type },
		)
	}

	public async get( guild: string, type: RoleTypes ): Promise<string | null> {
		const result = await this.model.findOne( { where: { guild, type } } )
		return result?.getDataValue( 'role' ) ?? null
	}
}

declare global {
	interface ModelRegistryEntries {
		roles: RoleModel
	}
}
