import { Command, type CommandOptions } from '../../framework'
import { ApplyOptions } from '@sapphire/decorators'
import { type AutocompleteInteraction, type CommandInteraction, Permissions } from 'discord.js'
import { Fandom } from 'mw.js'
import Colors from '@bitomic/material-colors'

enum Options {
	Search = 'search'
}

@ApplyOptions<CommandOptions>( {
	defaultMemberPermissions: Permissions.FLAGS.MANAGE_GUILD,
	dm: false,
	enabled: true,
	name: 'wiki-search'
} )
export class UserCommand extends Command {
	protected override setOptions(): void {
		this.applicationCommandBase.options = [
			this.createOption( {
				autocomplete: true,
				name: Options.Search,
				required: true,
				type: 'STRING'
			} )
		]
	}

	public override async autocompleteRun( interaction: AutocompleteInteraction<'cached' | 'raw'> ): Promise<void> {
		const focused = interaction.options.getFocused()
		if ( focused.length === 0 ) {
			void interaction.respond( [] )
			return
		}

		const guildWikis = this.container.stores.get( 'models' ).get( 'guild-wikis' )
		const interwiki = await guildWikis.get( interaction.guildId )
		if ( !interwiki ) {
			void interaction.respond( [] )
			return
		}
		const wiki = Fandom.getWiki( interwiki )
		const searchItems =  await wiki.search( {
			limit: 5,
			search: interaction.options.getFocused()
		} )
		const results = searchItems[ 1 ].filter( i => i.length > 0 )
		void interaction.respond( results.map( i => ( {
			name: i,
			value: i
		} ) ) )
	}

	public override async chatInputRun( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		await interaction.deferReply()

		const guildWikis = this.container.stores.get( 'models' ).get( 'guild-wikis' )
		const interwiki = await guildWikis.get( interaction.guildId )
		if ( !interwiki ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.amber.s800,
					key: 'noWikiSet',
					target: interaction
				} )
			} )
			return
		}
		const wiki = Fandom.getWiki( interwiki )

		void interaction.editReply( `<${ wiki.getURL( interaction.options.getString( Options.Search, true ) ) }>` )
	}
}
