import { Command, type CommandOptions } from '../../framework'
import { ApplyOptions } from '@sapphire/decorators'
import { type CommandInteraction, Permissions } from 'discord.js'
import { Fandom, type FandomWiki } from 'mw.js'
import Colors from '@bitomic/material-colors'

enum Options {
	Interwiki = 'interwiki'
}

@ApplyOptions<CommandOptions>( {
	defaultMemberPermissions: Permissions.FLAGS.MANAGE_GUILD,
	dm: false,
	enabled: true,
	name: 'wiki'
} )
export class UserCommand extends Command {
	protected override setOptions(): void {
		this.applicationCommandBase.options = [
			this.createOption( {
				name: Options.Interwiki,
				required: true,
				type: 'STRING'
			} )
		]
	}

	public override async chatInputRun( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		await interaction.deferReply()

		const interwiki = interaction.options.getString( Options.Interwiki, true )
		let wiki: FandomWiki
		try {
			wiki = Fandom.getWiki( interwiki )
		} catch {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.red.s800,
					key: 'invalidInterwiki',
					target: interaction
				} )
			} )
			return
		}

		const exists = await wiki.exists()
		if ( !exists ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.red.s800,
					key: 'inexistentWiki',
					replace: { url: Fandom.interwiki2url( interwiki ) },
					target: interaction
				} )
			} )
			return
		}

		await this.container.stores.get( 'models' ).get( 'guild-wikis' )
			.set( interaction.guildId, interwiki )
		void interaction.editReply( {
			embeds: await this.simpleEmbed( {
				color: Colors.green.s800,
				key: 'setWikiSuccess',
				replace: { url: Fandom.interwiki2url( interwiki ) },
				target: interaction
			} )
		} )

	}
}
