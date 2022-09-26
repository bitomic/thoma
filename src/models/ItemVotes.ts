import { DataTypes, type ModelStatic, type Model as SequelizeModel } from 'sequelize'
import type { PieceContext, PieceOptions } from '@sapphire/pieces'
import { Model } from '../framework'

interface IItemVote {
	date: Date
	item: string
	user: string
}

interface IItemVoteInterface extends SequelizeModel<IItemVote, IItemVote>, IItemVote {
}

export class ItemVoteModel extends Model<IItemVoteInterface> {
	public readonly model: ModelStatic<IItemVoteInterface>

	public constructor( context: PieceContext, options: PieceOptions ) {
		super( context, {
			...options,
			name: 'item-votes'
		} )

		this.model = this.container.sequelize.define<IItemVoteInterface>(
			'ItemVote',
			{
				date: DataTypes.DATE,
				item: DataTypes.STRING,
				user: DataTypes.STRING
			},
			{
				tableName: 'ItemVotes',
				timestamps: false
			}
		)
	}

	public async addVote( user: string, item: string ): Promise<void> {
		await this.model.upsert(
			{ date: new Date(), item, user },
		)
	}

	public async canVote( user: string ): Promise<boolean> {
		const lastVote = await this.getLastVote( user )
		if ( !lastVote ) return true
		return lastVote.getTime() + 1000 * 60 * 60 < Date.now()
	}

	public async getLastVote( user: string ): Promise<Date | null> {
		const lastVote = await this.model.findOne( { where: { user } } )
		return lastVote?.date ?? null
	}
}

declare global {
	interface ModelRegistryEntries {
		'item-votes': ItemVoteModel
	}
}
