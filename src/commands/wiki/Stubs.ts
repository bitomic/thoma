import { type ApplicationCommandRegistry, Command } from '@sapphire/framework'
import { Fandom, type FandomWiki, sleep } from 'mw.js'
import { ApplyOptions } from '@sapphire/decorators'
import { type CommandInteraction } from 'discord.js'
import type { CommandOptions } from '@sapphire/framework'
import { getInteractionChannel } from '../../utilities'
import type { IStub } from '../../models/Stub'
import { PermissionFlagsBits } from 'discord-api-types/v9'

interface IRevisionsResponse {
	query: {
		pages: Array<{
			pageid: number
			revisions: [ {
				timestamp: string
				size: number
			} ]
			title: string
		}>
	}
}

@ApplyOptions<CommandOptions>( {
	description: 'Genera una lista de esbozos a revisar.',
	enabled: true,
	name: 'esbozos'
	} )
export class UserCommand extends Command {
	public override async registerApplicationCommands( registry: ApplicationCommandRegistry ): Promise<void> {
		registry.registerChatInputCommand(
			builder => builder
				.setName( this.name )
				.setDescription( this.description )
				.setDMPermission( false )
				.setDefaultMemberPermissions( PermissionFlagsBits.ManageGuild ),
			await this.container.stores.get( 'models' ).get( 'commands' )
				.getData( this.name )
		)
	}

	public override async chatInputRun( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		await interaction.deferReply( { ephemeral: true } )
		const channel = await getInteractionChannel( interaction )
		if ( !channel || channel.type !== 'GUILD_TEXT' ) return

		const models = this.container.stores.get( 'models' )

		const wiki = Fandom.getWiki( 'es.genshin-impact' )
		const titles = await this.getStubs( wiki )
		const group = await models.get( 'stubgroups' ).assert( interaction.guildId, interaction.channelId, 'es.genshin-impact' )
		const stubs: IStub[] = []
		const existingStubs = ( await models.get( 'stubs' ).model.findAll( { where: { group } } ) )
			.reduce( ( list, item ) => {
				list.add( item.pageid )
				return list
			}, new Set<number>() )

		while ( titles.length ) {
			const params = {
				action: 'query',
				format: 'json',
				formatversion: 2,
				prop: 'revisions',
				rvprop: [ 'ids', 'timestamp', 'size' ],
				titles: titles.splice( 0, 50 )
			}
			const { pages } = ( await wiki.get<IRevisionsResponse>( params ) ).query
			for ( const page of pages ) {
				if ( existingStubs.has( page.pageid ) ) continue

				const [ revision ] = page.revisions
				const date = Math.floor( new Date( revision.timestamp ).getTime() / 1000 )
				await channel.send( {
					components: [ {
						components: [ {
							customId: 'review-stub',
							label: 'Marcar como revisado',
							style: 'PRIMARY',
							type: 'BUTTON'
						} ],
						type: 'ACTION_ROW'
					} ],
					embeds: [ {
						color: 0x0276aa,
						fields: [
							{ name: 'Creación', value: `${ revision.timestamp }\n(<t:${ date }:R>)` },
							{ name: 'Tamaño', value: `${ revision.size } caracteres` }
						],
						title: page.title,
						url: `https://genshin-impact.fandom.com/es/wiki/${ encodeURIComponent( page.title ) }`
					} ]
				} )
				stubs.push( {
					group,
					pageid: page.pageid,
					title: page.title
				} )
				await sleep( 1000 )
			}
		}

		await models.get( 'stubs' ).model.bulkCreate( stubs )
		const threads = await channel.threads.fetch()
		if ( threads.threads.size === 0 ) await channel.threads.create( { name: 'Registro' } )
		await interaction.editReply( 'Done!' )
	}

	protected async getStubs( wiki: FandomWiki ): Promise<string[]> {
		return ( await wiki.queryList( {
			cmlimit: 'max',
			cmnamespace: 0,
			cmtitle: 'Category:Esbozos',
			list: 'categorymembers'
		} ) ).map( i => i.title )
	}
}
