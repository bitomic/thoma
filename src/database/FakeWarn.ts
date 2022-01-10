import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from '../lib'

export interface IFakeWarn {
	author: string
	date: Date
	guild: string
	id?: number
	reason: string
	user: string
}

export interface IFakeWarnInterface extends Model<IFakeWarn, IFakeWarn>, IFakeWarn {
}

export const FakeWarns = sequelize.define<IFakeWarnInterface>(
	'FakeWarns',
	{
		author: DataTypes.STRING,
		date: DataTypes.DATE,
		guild: DataTypes.STRING,
		id: {
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER
		},
		reason: DataTypes.STRING,
		user: DataTypes.STRING
	},
	{
		tableName: 'FakeWarns',
		timestamps: false
	}
)
