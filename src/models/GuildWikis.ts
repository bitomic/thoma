import { DataTypes, type ModelStatic, type Model as SequelizeModel } from 'sequelize'
import type { PieceContext, PieceOptions } from '@sapphire/pieces'
import { Model } from '../framework'

interface IGuildWiki {
	guild: string
	wiki: string
}

interface IGuildWikiInterface extends SequelizeModel<IGuildWiki, IGuildWiki>, IGuildWiki {
}

export class GuildWikiModel extends Model<IGuildWikiInterface> {
	public readonly model: ModelStatic<IGuildWikiInterface>

	public constructor( context: PieceContext, options: PieceOptions ) {
		super( context, {
			...options,
			name: 'guild-wikis'
		} )

		this.model = this.container.sequelize.define<IGuildWikiInterface>(
			'GuildWiki',
			{
				guild: {
					primaryKey: true,
					type: DataTypes.STRING
				},
				wiki: DataTypes.STRING
			},
			{
				tableName: 'GuildWikis',
				timestamps: false
			}
		)
	}

	public async set( guild: string, wiki: string ): Promise<void> {
		await this.model.upsert(
			{ guild, wiki },
		)
	}

	public async get( guild: string ): Promise<string | null> {
		const result = await this.model.findOne( { where: { guild } } )
		return result?.getDataValue( 'wiki' ) ?? null
	}
}

declare global {
	interface ModelRegistryEntries {
		'guild-wikis': GuildWikiModel
	}
}
