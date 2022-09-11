import { Command, type CommandOptions } from '../../framework'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { env } from '../../lib'

@ApplyOptions<CommandOptions>( {
	dm: false,
	enabled: true,
	guildIds: [ env.DISCORD_DEVELOPMENT_SERVER ],
	name: 'commands-data'
} )
export class UserCommand extends Command {
	public override async chatInputRun( interaction: CommandInteraction ): Promise<void> {
		const t1 = Date.now()
		await interaction.reply( ':hourglass_flowing_sand: Removing commands. This may take a while...' )
		await this.container.stores.get( 'models' ).get( 'commands' )
			.truncate()

		await this.container.client.application?.commands.set( [] )
		const guilds = await this.container.client.guilds.fetch()
		await interaction.editReply( `:ballot_box_with_check: Global commands removed.\n:hourglass_flowing_sand: Removing guild-specific commands (checking for ${ guilds.size } guilds).` )
		for ( const [ _, guild ] of guilds ) {
			const fetchGuild = await guild.fetch()
			const guildCommands = await fetchGuild.commands.fetch()
			if ( guildCommands.size === 0 ) continue
			await fetchGuild.commands.set( [] )
		}
		await interaction.editReply( `:ballot_box_with_check: Global commands removed.\n:ballot_box_with_check: Removing guild-specific commands (checking for ${ guilds.size } guilds).\n:hourglass_flowing_sand: Reloading commands.` )
		await this.container.stores.get( 'commands' ).loadAll()
		const t2 = Date.now()
		await interaction.editReply( `:ballot_box_with_check: Global commands removed.\n:ballot_box_with_check: Removing guild-specific commands (checking for ${ guilds.size } guilds).\n:ballot_box_with_check: Reloading commands.\n:ballot_box_with_check: Done! ${ ( t2 - t1 ) / 1000 } seconds.` )
	}
}
