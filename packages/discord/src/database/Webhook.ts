import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from '../lib'

export interface IWebhook {
	avatar: string
	name: string
	snowflake: string
	type: 'channel' | 'guild'
}

export interface IWebhookInterface extends Model<IWebhook, IWebhook>, IWebhook {
}

export const Webhooks = sequelize.define<IWebhookInterface>(
	'Webhooks',
	{
		avatar: DataTypes.STRING,
		name: DataTypes.STRING,
		snowflake: {
			primaryKey: true,
			type: DataTypes.STRING
		},
		type: DataTypes.STRING
	},
	{
		tableName: 'Webhooks',
		timestamps: false
	}
)
