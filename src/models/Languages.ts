import { DataTypes, type ModelStatic, type Model as SequelizeModel } from 'sequelize'
import type { PieceContext, PieceOptions } from '@sapphire/pieces'
import type { Language } from '../utilities'
import { Model } from '../framework'

interface ILanguage {
	lang: Language
	snowflake: string
}

interface ILanguageInterface extends SequelizeModel<ILanguage, ILanguage>, ILanguage {
}

export class LanguageModel extends Model<ILanguageInterface> {
	public readonly model: ModelStatic<ILanguageInterface>

	public constructor( context: PieceContext, options: PieceOptions ) {
		super( context, {
			...options,
			name: 'languages'
		} )

		this.model = this.container.sequelize.define<ILanguageInterface>(
			'Language',
			{
				lang: DataTypes.STRING,
				snowflake: {
					primaryKey: true,
					type: DataTypes.STRING
				}
			},
			{
				tableName: 'Languages',
				timestamps: false
			}
		)
	}

	public async set( snowflake: string, lang: Language ): Promise<void> {
		await this.model.upsert(
			{ lang, snowflake },
		)
	}

	public async get( snowflake: string ): Promise<Language | null> {
		const result = await this.model.findOne( { where: { snowflake } } )
		return result?.getDataValue( 'lang' ) ?? null
	}
}

declare global {
	interface ModelRegistryEntries {
		languages: LanguageModel
	}
}
