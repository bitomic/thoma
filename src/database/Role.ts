import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from '../lib'

export interface IRole {
	emoji?: string
	id?: string
	label?: string
	message: string
	role: string
}

export interface IRoleInterface extends Model<IRole, IRole>, IRole {
}

export const Roles = sequelize.define<IRoleInterface>(
	'Roles',
	{
		emoji: {
			allowNull: true,
			type: DataTypes.STRING
		},
		id: {
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER
		},
		label: {
			allowNull: true,
			type: DataTypes.STRING
		},
		message: {
			references: {
				key: 'message',
				model: 'RoleMessages'
			},
			type: DataTypes.STRING,
			unique: 'messageRole'
		},
		role: {
			type: DataTypes.STRING,
			unique: 'messageRole'
		}
	},
	{
		tableName: 'Roles',
		timestamps: false
	}
)
