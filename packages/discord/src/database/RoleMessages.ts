import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from '../lib'

export interface IRoleMessage {
	channel: string
	guild: string
	message: string
}

export interface IRoleMessageInterface extends Model<IRoleMessage, IRoleMessage>, IRoleMessage {
}

export const RoleMessages = sequelize.define<IRoleMessageInterface>(
	'RoleMessages',
	{
		channel: DataTypes.STRING,
		guild: DataTypes.STRING,
		message: {
			primaryKey: true,
			type: DataTypes.STRING
		}
	},
	{
		tableName: 'RoleMessages',
		timestamps: false
	}
)
