import { DataTypes } from 'sequelize'
import type { Model } from 'sequelize'
import { sequelize } from '../lib'

export interface IGuildChannel {
	channel: string
	guild: string
	type: 'warns' | 'fake-warns'
}

export interface IGuildChannelInterface extends Model<IGuildChannel, IGuildChannel>, IGuildChannel {
}

export const GuildChannels = sequelize.define<IGuildChannelInterface>(
	'GuildChannels',
	{
		channel: DataTypes.STRING,
		guild: {
			primaryKey: true,
			type: DataTypes.STRING
		},
		type: {
			primaryKey: true,
			type: DataTypes.STRING
		}
	},
	{
		tableName: 'GuildChannels',
		timestamps: false
	}
)
