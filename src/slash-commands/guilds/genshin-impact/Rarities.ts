import { ApplyOptions } from '@sapphire/decorators'
import { Colors } from '../../../utilities'
import type { CommandInteraction } from 'discord.js'
import { env } from '../../../lib'
import { Fandom } from 'mw.js'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'
import { parse } from 'mwparser'
import { SlashCommand } from '../../../framework'
import type { SlashCommandOptions } from '../../../framework'
import { SlashPermissions } from '../../../decorators'

@SlashPermissions( {
	ids: [ '787145860134993920' ],
	permission: true,
	type: 'ROLE'
} )
@ApplyOptions<SlashCommandOptions>( {
	defaultPermission: false,
	description: 'Actualiza la rareza de los objetos.',
	enabled: true,
	guilds: [ 'genshinImpact' ],
	name: 'rarezas'
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction<'present'> ): Promise<void> {
		await interaction.deferReply()
		await interaction.editReply( {
			embeds: [
				{
					color: Colors.green[ 10 ],
					description: 'Se está realizando la tarea. Notificaré cuando haya terminado, a menos que ocurra algún error.'
				}
			]
		} )

		try {
			const fandom = new Fandom()
			const wiki = fandom.getWiki( 'es.genshin-impact' )
			const titles = await this.getPages( wiki )
			const rarities = await this.getRarities( { titles, wiki } )
			const lua = format( rarities )

			const bot = await fandom.login( {
				password: env.FANDOM_PASSWORD,
				username: env.FANDOM_USERNAME,
				wiki
			} )

			await bot.edit( {
				bot: true,
				text: lua,
				title: 'Module:Rarezas'
			} )

			await interaction.followUp( {
				embeds: [
					{
						color: Colors.green[ 10 ],
						description: 'Tarea finalizada exitosamente.'
					}
				]
			} )
		} catch ( e ) {
			await interaction.followUp( {
				content: `<@!${ env.DISCORD_OWNER }>`,
				embeds: [
					{
						color: Colors.red[ 10 ],
						description: `Ha ocurrido un error inesperado. Vuelve a intentarlo más tarde o espera a que <@!${ env.DISCORD_OWNER }> revise los registros.`
					}
				]
			} )
		}
	}

	public async getPages( wiki: FandomWiki ): Promise<string[]> {
		const pages: string[] = []
		const templates = [
			'Plantilla:Infobox Arma',
			'Plantilla:Infobox Comida',
			'Plantilla:Infobox Objeto',
			'Plantilla:Infobox Personaje jugable'
		]

		for ( const template of templates ) {
			const transclusions = await wiki.getTransclusions( template )
			pages.push( ...transclusions )
		}

		return pages
	}

	public async getRarities( { titles, wiki }: { titles: string[], wiki: FandomWiki } ): Promise<Record<string, number>> {
		const rarities: Record<string, number> = {}

		for await ( const page of wiki.iterPages( titles ) ) {
			const content = page.revisions[ 0 ]?.slots.main.content
			if ( !content ) continue
			const parsed = parse( content )
			const infoboxName = parsed.templates.map( t => t.name ).find( t => t.startsWith( 'Infobox' ) )
			if ( !infoboxName ) continue
			const [ infobox ] = parsed.findTemplate( infoboxName ).nodes
			if ( !infobox ) continue
			const rarity = Number( infobox.getParameter( 'rareza' )?.value )
			if ( isNaN( rarity ) ) continue
			rarities[ page.title ] = rarity
		}

		return rarities
	}
}
