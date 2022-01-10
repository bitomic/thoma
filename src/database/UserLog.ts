import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from '../lib'

export interface IUserLog {
	author: string
	guild: string
	id?: number
	messageId?: string
	reason: string
	type: 'timeout' | 'warn'
	user: string
}

export interface IUserLogInterface extends Model<IUserLog, IUserLog>, IUserLog {
}

export const UserLogs = sequelize.define<IUserLogInterface>(
	'UserLogs',
	{
		author: DataTypes.STRING,
		guild: DataTypes.STRING,
		id: {
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER
		},
		messageId: {
			allowNull: true,
			type: DataTypes.STRING
		},
		reason: DataTypes.STRING,
		type: DataTypes.STRING,
		user: DataTypes.STRING
	},
	{
		tableName: 'UserLogs',
		timestamps: false
	}
)
