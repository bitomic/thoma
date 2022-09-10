import { DataTypes, type ModelStatic, type Model as SequelizeModel } from 'sequelize'
import type { PieceContext, PieceOptions } from '@sapphire/pieces'
import type { ChannelTypes } from '../utilities'
import { Model } from '../framework'

interface IChannel {
	channel: string
	guild: string
	type: ChannelTypes
}

interface IChannelInterface extends SequelizeModel<IChannel, IChannel>, IChannel {
}

export class ChannelModel extends Model<IChannelInterface> {
	public readonly model: ModelStatic<IChannelInterface>

	public constructor( context: PieceContext, options: PieceOptions ) {
		super( context, {
			...options,
			name: 'channels'
		} )

		this.model = this.container.sequelize.define<IChannelInterface>(
			'Channel',
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
				tableName: 'Channels',
				timestamps: false
			}
		)
	}

	public async set( { channel, guild, type }: { channel: string, guild: string, type: ChannelTypes } ): Promise<void> {
		await this.model.upsert(
			{ channel, guild, type },
		)
	}

	public async get( guild: string, type: ChannelTypes ): Promise<string | null> {
		const result = await this.model.findOne( { where: { guild, type } } )
		return result?.getDataValue( 'channel' ) ?? null
	}
}

declare global {
	interface ModelRegistryEntries {
		channels: ChannelModel
	}
}
