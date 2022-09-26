import { Command, type CommandOptions } from '../../framework'
import type { AutocompleteInteraction, CommandInteraction } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
import Fuse from 'fuse.js'
import { Fandom } from 'mw.js'
import Colors from '@bitomic/material-colors'
import { Guilds } from '../../utilities'
import { env } from '../../lib'

enum Options {
	Item = 'item'
}

@ApplyOptions<CommandOptions>( {
	dm: false,
	enabled: true,
	guildIds: [ Guilds.TheBindingOfIsaac ],
	name: 'vote'
} )
export class UserCommand extends Command {
	protected items = new Fuse<string>( [] )
	protected isReady = false

	protected async loadItems(): Promise<void> {
		if ( this.isReady ) return
		this.isReady = true
		const wiki = Fandom.getWiki( 'es.bindingofisaac' )
		const passiveItems = ( await wiki.queryList( {
			cmlimit: 'max',
			cmnamespace: 0,
			cmtitle: 'Category:Objetos pasivos',
			list: 'categorymembers'
		} ) ).map( i => i.title )
		const activeItems = ( await wiki.queryList( {
			cmlimit: 'max',
			cmnamespace: 0,
			cmtitle: 'Category:Objetos activables',
			list: 'categorymembers'
		} ) ).map( i => i.title )
		this.items = new Fuse( [ ...passiveItems, ...activeItems ] )
	}

	protected override setOptions(): void {
		this.applicationCommandBase.options = [
			this.createOption( {
				autocomplete: true,
				name: Options.Item,
				required: true,
				type: 'STRING'
			} )
		]
	}

	public override async autocompleteRun( interaction: AutocompleteInteraction ): Promise<void> {
		await this.loadItems()

		const focused = interaction.options.getFocused()
		if ( focused.length === 0 ) {
			await interaction.respond( [] )
			return
		}
		const result = this.items.search( focused, { limit: 5 } )
		await interaction.respond( result.map( i => ( { name: i.item, value: i.item } ) ) )
	}

	public override async chatInputRun( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		if ( env.NODE_ENV === 'production' && interaction.channelId !== '820804713187639298' ) {
			void interaction.reply( {
				embeds: [ {
					color: Colors.amber.s800,
					description: 'Solo puedes usar este comando en <#820804713187639298>.'
				} ],
				ephemeral: true
			} )
			return
		}

		await interaction.deferReply()
		await this.loadItems()

		const itemVotes = this.container.stores.get( 'models' ).get( 'item-votes' )
		const canVote = await itemVotes.canVote( interaction.user.id )
		if ( !canVote ) {
			const lastVote = await itemVotes.getLastVote( interaction.user.id ) ?? new Date()
			void interaction.editReply( {
				embeds: [ {
					color: Colors.amber.s800,
					description: `Solo puedes hacer un voto por hora. Tu último voto fue <t:${ Math.floor( lastVote.getTime() / 1000 ) }:R>.`
				} ]
			} )
			return
		}

		const vote = interaction.options.getString( Options.Item, true )
		const result = this.items.search( vote, { limit: 1 } ).at( 0 )?.item
		if ( !result ) {
			void interaction.editReply( {
				embeds: [ {
					color: Colors.amber.s800,
					description: `No he podido encontrar un objeto que se parezca a lo que has escrito: ${ vote }. Recuerda que hay un autocompletado para el comando, y solo entiendo el nombre de los objetos en español.`
				} ]
			} )
			return
		}

		await itemVotes.addVote( interaction.user.id, result )
		void interaction.editReply( {
			embeds: [ {
				color: Colors.deepPurple.s800,
				description: `He registrado tu voto correctamente: ${ result }.`
			} ]
		} )
	}
}
