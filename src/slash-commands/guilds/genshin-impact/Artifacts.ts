import { Colors, Guilds } from '../../../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { env } from '../../../lib'
import { Fandom } from 'mw.js'
import type { FandomWiki } from 'mw.js'
import { format } from 'lua-json'
import { parse } from 'mwparser'
import { SlashCommand } from '../../../framework'
import type { SlashCommandOptions } from '../../../framework'
import { SlashPermissions } from '../../../decorators'
import { sleep } from '@bitomic/utilities'

@SlashPermissions( {
	ids: [ Guilds.genshinImpact.roles.contentCreator ],
	permission: true,
	type: 'ROLE'
} )
@ApplyOptions<SlashCommandOptions>( {
	defaultPermission: false,
	description: 'Actualiza la lista de artefactos y crea las redirecciones necesarias.',
	enabled: true,
	guilds: [ 'genshinImpact' ],
	name: 'artefactos'
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction<'present'> ): Promise<void> {
		await interaction.deferReply()

		const embed = {
			color: Colors.amber[ 10 ],
			description: 'Se está realizando la tarea. Notificaré cuando haya terminado, a menos que ocurra algún error.'
		}
		await interaction.editReply( {
			embeds: [ embed ]
		} )


		try {
			const fandom = new Fandom()
			const wiki = fandom.getWiki( 'es.genshin-impact' )
			const artifacts = await this.getArtifactPieces( wiki )
			const lua = format( artifacts )
			const bot = await fandom.login( {
				password: env.FANDOM_PASSWORD,
				username: env.FANDOM_USERNAME,
				wiki
			} )

			await bot.edit( {
				bot: true,
				text: lua,
				title: 'Module:Artefactos'
			} )

			embed.description += '\n- Módulo de artefactos actualizado.'
			await interaction.editReply( {
				embeds: [ embed ]
			} )

			const pieces = Object.values( artifacts ).reduce( ( collection, item ) => {
				for ( const piece of Object.values( item ) ) {
					collection.push( piece )
				}
				return collection
			}, [] as string[] )
			const exists = await wiki.pagesExist( pieces )

			for ( const [
				artifactSet, artifactPieces
			] of Object.entries( artifacts ) ) {
				let createdRedirects = false
				for ( const [
					_, piece
				] of Object.entries( artifactPieces ) ) {
					if ( exists[ piece ] ) continue
					await bot.edit( {
						bot: true,
						text: `#REDIRECT [[${ artifactSet }]]`,
						title: piece
					} )
					await sleep( 2000 )
					createdRedirects = true
				}
				if ( createdRedirects ) {
					embed.description += `\n- Creadas redirecciones para **${ artifactSet }**.`
					await interaction.editReply( {
						embeds: [ embed ]
					} )
				}
			}

			// eslint-disable-next-line prefer-destructuring
			embed.color = Colors.green[ 10 ]
			embed.description += '\n\nTarea finalizada.'
			await interaction.editReply( {
				embeds: [ embed ]
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

	public async getArtifactPieces( wiki: FandomWiki ): Promise<Record<string, Record<string, string>>> {
		const generator = wiki.iterQueryProp( {
			prop: 'transcludedin',
			tilimit: 'max',
			tinamespace: 0,
			tiprop: [ 'title' ],
			titles: 'Plantilla:Infobox Artefacto'
		} )

		const artifacts: Record<string, Record<string, string>> = {}
		const parts = [
			'flor', 'pluma', 'arenas', 'cáliz', 'tiara'
		]

		const sets: string[] = []
		for await ( const template of generator ) {
			for ( const item of template.transcludedin ) {
				sets.push( item.title )
			}
		}

		for await ( const page of wiki.iterPages( sets ) ) {
			if ( 'missing' in page ) continue
			const { content } = page.revisions[ 0 ].slots.main
			const parsed = parse( content )
			const infobox = parsed.templates.find( t => t.name === 'Infobox Artefacto' )
			if ( !infobox ) continue

			for ( const part of parts ) {
				const piece = infobox.getParameter( part )
				if ( !piece ) continue

				const collection = artifacts[ page.title ] ?? {}
				collection[ part ] = piece.value
				if ( !artifacts[ page.title ] ) artifacts[ page.title ] = collection
			}
		}

		return artifacts
	}
}
