import { type ApplicationCommandRegistry, type Args, type Awaitable, type PieceContext, Command as SapphireCommand, type CommandOptions as SapphireCommandOptions } from '@sapphire/framework'
import type { ApplicationCommandOptionData, ChatInputApplicationCommandData, CommandInteraction, PermissionResolvable } from 'discord.js'
import { env } from '../../lib'
import { type DistributiveOmit, getCommand, getCommandI18n } from '../../utilities'

export abstract class Command<T extends string = string, ApplicationCommand extends boolean = true> extends SapphireCommand<Args, CommandOptions> {
	protected readonly applicationCommandBase: ApplicationCommand extends true ? ChatInputApplicationCommandData : ChatInputApplicationCommandData | null

	protected keys = new Set<T>()
	protected keysRealValues: Record<T, string> = {} as Record<T, string>

	public constructor( context: PieceContext, options: CommandOptions ) {
		super( context, options )
		this.applicationCommandBase = {
			...getCommand( this.category, this.name ),
			defaultMemberPermissions: options.defaultMemberPermissions ?? null,
			descriptionLocalizations: getCommandI18n( this.category, this.name, 'description' ),
			dmPermission: options.dm,
			nameLocalizations: getCommandI18n( this.category, this.name, 'name' )
		}
	}

	protected createOption<D extends ApplicationCommandOptionData = ApplicationCommandOptionData>( option: DistributiveOmit<ApplicationCommandOptionData, 'description' | 'descriptionLocalizations' | 'nameLocalizations'> ): D {
		this.keys.add( option.name as T )
		return Object.assign(
			option,
			getCommand( this.category, `${ this.name }.${ option.name }`, undefined, 'commands-options' ),
			{
				descriptionLocalizations: getCommandI18n( this.category, `${ this.name }-${ option.name }`, 'description', 'commands-options' ),
				nameLocalizations: getCommandI18n( this.category, this.name, 'name', 'commands-options' )
			}
		) as unknown as D
	}

	protected getAttachment( interaction: CommandInteraction, option: T, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getAttachment' ]>, null>
	protected getAttachment( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getAttachment' ]>
	protected getAttachment( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getAttachment' ]> {
		return interaction.options.getAttachment( this.keysRealValues[ option ], required )
	}

	protected getBoolean( interaction: CommandInteraction, option: T, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getBoolean' ]>, null>
	protected getBoolean( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getBoolean' ]>
	protected getBoolean( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getBoolean' ]> {
		return interaction.options.getBoolean( this.keysRealValues[ option ], required )
	}

	protected getChannel( interaction: CommandInteraction, option: T, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getChannel' ]>, null>
	protected getChannel( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getChannel' ]>
	protected getChannel( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getChannel' ]> {
		return interaction.options.getChannel( this.keysRealValues[ option ], required )
	}

	protected getInteger( interaction: CommandInteraction, option: T, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getInteger' ]>, null>
	protected getInteger( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getInteger' ]>
	protected getInteger( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getInteger' ]> {
		return interaction.options.getInteger( this.keysRealValues[ option ], required )
	}

	protected getMember( interaction: CommandInteraction, option: T, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getMember' ]>, null>
	protected getMember( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getMember' ]>
	protected getMember( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getMember' ]> {
		return interaction.options.getMember( this.keysRealValues[ option ], required )
	}

	protected getMentionable( interaction: CommandInteraction, option: T, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getMentionable' ]>, null>
	protected getMentionable( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getMentionable' ]>
	protected getMentionable( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getMentionable' ]> {
		return interaction.options.getMentionable( this.keysRealValues[ option ], required )
	}

	protected getNumber( interaction: CommandInteraction, option: T, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getNumber' ]>, null>
	protected getNumber( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getNumber' ]>
	protected getNumber( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getNumber' ]> {
		return interaction.options.getNumber( this.keysRealValues[ option ], required )
	}

	protected getRole( interaction: CommandInteraction, option: T, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getRole' ]>, null>
	protected getRole( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getRole' ]>
	protected getRole( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getRole' ]> {
		return interaction.options.getRole( this.keysRealValues[ option ], required )
	}

	protected getString( interaction: CommandInteraction, option: T, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getString' ]>, null>
	protected getString( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getString' ]>
	protected getString( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getString' ]> {
		return interaction.options.getString( this.keysRealValues[ option ], required )
	}

	protected getSubcommand( interaction: CommandInteraction, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getSubcommand' ]>, null>
	protected getSubcommand( interaction: CommandInteraction, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getSubcommand' ]>
	protected getSubcommand( interaction: CommandInteraction, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getSubcommand' ]> {
		return interaction.options.getSubcommand( required || undefined )
	}

	protected getSubcommandGroup( interaction: CommandInteraction, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getSubcommandGroup' ]>, null>
	protected getSubcommandGroup( interaction: CommandInteraction, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getSubcommandGroup' ]>
	protected getSubcommandGroup( interaction: CommandInteraction, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getSubcommandGroup' ]> {
		return interaction.options.getSubcommandGroup( required || undefined )
	}

	protected getUser( interaction: CommandInteraction, option: T, required: true ): Exclude<ReturnType<CommandInteraction[ 'options' ][ 'getUser' ]>, null>
	protected getUser( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getUser' ]>
	protected getUser( interaction: CommandInteraction, option: T, required?: boolean ): ReturnType<CommandInteraction[ 'options' ][ 'getUser' ]> {
		return interaction.options.getUser( this.keysRealValues[ option ], required )
	}

	protected async getRegisterOptions(): Promise<ApplicationCommandRegistry.RegisterOptions> {
		return {
			...await this.container.stores.get( 'models' ).get( 'commands' )
				.getData( this.name ),
			guildIds: this.options.guildIds ?? []
		}
	}

	private populateKeysRealValues(): Record<T, string> {
		if ( !this.applicationCommandBase?.options ) return this.keysRealValues

		const category = this.category ? `${ this.category }.` : ''
		const prefix = `commands-options:${ category }${ this.name }`
		for ( const key of this.keys ) {
			this.keysRealValues[ key ] = this.container.i18n.getT( env.DEFAULT_LANGUAGE )( `${ prefix }.${ key }.name` )
		}
		return this.keysRealValues
	}

	public override async registerApplicationCommands( registry: ApplicationCommandRegistry ): Promise<void> {
		await this.setOptions()
		this.populateKeysRealValues()
		if ( this.applicationCommandBase ) {
			registry.registerChatInputCommand( this.applicationCommandBase, await this.getRegisterOptions() )
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	protected setOptions(): Awaitable<void> {}
}

export interface CommandOptions extends SapphireCommandOptions {
	defaultMemberPermissions?: PermissionResolvable
	dm: boolean
	guildIds?: string[]
	name?: string
}

