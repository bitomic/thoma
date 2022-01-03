import type { Guild, GuildApplicationCommandPermissionData } from 'discord.js'
import { env } from '../lib'
import { SlashCommand } from './SlashCommand'
import type { SlashCommandOptions } from './SlashCommand'
import { Store } from '@sapphire/pieces'

export class SlashCommandStore extends Store<SlashCommand> {
	public constructor() {
		// @ts-expect-error - Either expect-error or cast to any: https://github.com/sapphiredev/framework/blob/db6febd56afeaeff1f23afce2a269beecb316804/src/lib/structures/CommandStore.ts#L10
		super( SlashCommand, { name: 'slash-commands' } )
	}

	public async registerCommands() {
		const { client } = this.container

		// This will split the slash commands between global and guild only.
		const slashCommands = this.container.stores.get( 'slash-commands' )
		await client.guilds.fetch() // retrieves Snowflake & Oauth2Guilds

		if ( env.NODE_ENV === 'development' ) {
			const guild = await client.guilds.fetch( env.DISCORD_DEVELOPMENT_SERVER )
			await this.setGuildCommands( guild, slashCommands.map( command => command.commandData ) )
			return
		}

		const [
			guildCmds, globalCmds
		] = slashCommands.partition( c => c.guilds.length !== 0 )
		const guilds = guildCmds.reduce( ( accumulator, command ) => {
			for ( const guild of command.guilds ) {
				accumulator.add( guild )
			}
			return accumulator
		}, new Set<string>() )

		// iterate to all connected guilds and apply the commands.
		for ( const id of guilds ) {
			const guild = await client.guilds.fetch( id )
			const commands = guildCmds.filter( cmd => cmd.guilds.includes( id ) )
				.map( cmd => cmd.commandData )
			await this.setGuildCommands( guild, commands )
		}

		// This will register global commands.
		await client.application?.commands.set( globalCmds.map( c => c.commandData ) )
	}

	private async setGuildCommands( guild: Guild, commands: SlashCommandOptions[] ): Promise<void> {
		const setCommands = await guild.commands.set( commands )
		const fullPermissions: GuildApplicationCommandPermissionData[] = []
		setCommands.forEach( ( command, commandId ) => {
			const piece = this.get( command.name )
			if ( !piece?.commandData.permissions || piece.commandData.permissions.length === 0 ) return
			fullPermissions.push( {
				id: commandId,
				permissions: piece.commandData.permissions
			} )
		} )
		await guild.commands.permissions.set( { fullPermissions } )
	}
}

declare module '@sapphire/pieces' {
	interface StoreRegistryEntries {
		'slash-commands': SlashCommandStore
	}
}
