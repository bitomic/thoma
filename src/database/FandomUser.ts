import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from '../lib'

export interface IFandomUser {
	snowflake: string
	sync?: boolean
	username: string
}

export interface IFandomUserInterface extends Model<IFandomUser, IFandomUser>, IFandomUser {
}

export const FandomUsers = sequelize.define<IFandomUserInterface>(
	'FandomUsers',
	{
		snowflake: {
			primaryKey: true,
			type: DataTypes.STRING
		},
		sync: {
			defaultValue: false,
			type: DataTypes.BOOLEAN
		},
		username: {
			type: DataTypes.STRING
		}
	},
	{
		tableName: 'FandomUsers',
		timestamps: false
	}
)
