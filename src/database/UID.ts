import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from '../lib'

export interface IUID {
	server: 'América' | 'Asia' | 'China' | 'Europa'
	snowflake: string
	uid: string
	username: string
}

export interface IUIDInterface extends Model<IUID, IUID>, IUID {
}

export const UIDs = sequelize.define<IUIDInterface>(
	'UIDs',
	{
		server: {
			primaryKey: true,
			type: DataTypes.STRING
		},
		snowflake: {
			primaryKey: true,
			type: DataTypes.STRING
		},
		uid: {
			type: DataTypes.STRING,
			unique: true
		},
		username: DataTypes.STRING
	},
	{
		tableName: 'UIDs',
		timestamps: false
	}
)
