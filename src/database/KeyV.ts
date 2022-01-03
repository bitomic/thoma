import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from '../lib'

export interface IKeyV {
	guild: string
	key: string
	value: string
}

export interface IKeyVInterface extends Model<IKeyV, IKeyV>, IKeyV {
}

export const KeyV = sequelize.define<IKeyVInterface>(
	'KeyV',
	{
		guild: {
			primaryKey: true,
			type: DataTypes.STRING
		},
		key: {
			primaryKey: true,
			type: DataTypes.STRING
		},
		value: {
			type: DataTypes.STRING
		}
	},
	{
		tableName: 'KeyV',
		timestamps: false
	}
)
