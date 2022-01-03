import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from '../lib'

export interface IRole {
	message: string
	role: string
}

export interface IRoleInterface extends Model<IRole, IRole>, IRole {
}

export const Roles = sequelize.define<IRoleInterface>(
	'Roles',
	{
		message: {
			references: {
				key: 'message',
				model: 'RoleMessages'
			},
			type: DataTypes.STRING
		},
		role: DataTypes.STRING
	},
	{
		tableName: 'Roles',
		timestamps: false
	}
)
