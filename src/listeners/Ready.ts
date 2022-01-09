import type { FullUserCommandOptions, SlashCommandOptions } from '../framework'
import type { Guild, GuildApplicationCommandPermissionData } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
import { env } from '../lib'
import { Guilds } from '../utilities'
import { Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'
import path from 'path'
import { TaskStore } from '../framework'

@ApplyOptions<ListenerOptions>( {
	event: 'ready',
	once: true
} )
export class UserEvent extends Listener {
	public async run(): Promise<void> {
		this.container.logger.info( 'Ready!' )

		await this.loadApplicationCommands()
		await this.loadTasks()
	}

	public async loadApplicationCommands(): Promise<void> {
		const setGuildCommands = async ( guild: Guild, commands: Array<SlashCommandOptions | FullUserCommandOptions> ): Promise<void> => {
			const setCommands = await guild.commands.set( commands )
			const fullPermissions: GuildApplicationCommandPermissionData[] = []

			const slashStore = this.container.stores.get( 'slash-commands' )
			setCommands.forEach( ( command, commandId ) => {
				const piece = slashStore.get( command.name )
				if ( !piece?.commandData.permissions || piece.commandData.permissions.length === 0 ) return
				fullPermissions.push( {
					id: commandId,
					permissions: piece.commandData.permissions
				} )
			} )
			await guild.commands.permissions.set( { fullPermissions } )
		}

		const { client } = this.container

		// This will split the slash commands between global and guild only.
		const slashCommands = this.container.stores.get( 'slash-commands' )
		const userCommands = this.container.stores.get( 'user-commands' )
		await client.guilds.fetch() // retrieves Snowflake & Oauth2Guilds

		if ( env.NODE_ENV === 'development' ) {
			const guild = await client.guilds.fetch( Guilds.development.id )
			await setGuildCommands( guild, [
				...slashCommands.map( command => command.commandData ),
				...userCommands.map( command => command.commandData )
			] )
			this.container.logger.info( 'Loaded application commands only in development server.' )
			return
		}

		const [
			guildSlashCmds, globalSlashCmds
		] = slashCommands.partition( c => c.guilds.length !== 0 )
		const [
			guildUserCmds, globalUserCmds
		] = userCommands.partition( c => c.guilds.length !== 0 )
		const guilds = [
			...guildSlashCmds.values(), ...guildUserCmds.values()
		].reduce( ( accumulator, command ) => {
			for ( const guild of command.guilds ) {
				accumulator.add( guild )
			}
			return accumulator
		}, new Set<string>() )

		// iterate to all connected guilds and apply the commands.
		for ( const id of guilds ) {
			const guild = await client.guilds.fetch( id )
			const commands = guildSlashCmds.filter( cmd => cmd.guilds.includes( id ) )
				.map( cmd => cmd.commandData )
			const userCmds = guildUserCmds.filter( cmd => cmd.guilds.includes( id ) )
				.map( cmd => cmd.commandData )
			await setGuildCommands( guild, [
				...commands, ...userCmds
			] )
		}

		// This will register global commands.
		await client.application?.commands.set( [
			...globalSlashCmds.map( c => c.commandData ),
			...globalUserCmds.map( c => c.commandData )
		] )
	}

	public async loadTasks(): Promise<void> {
		const taskStore = new TaskStore().registerPath( path.resolve( __dirname, '../tasks' ) )
		taskStore.container.client = this.container.client
		this.container.client.stores.register( taskStore )
		await taskStore.loadAll()
	}
}
