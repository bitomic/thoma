import { type ApplicationCommandRegistry, type Args, type Awaitable, type PieceContext, type PieceOptions, Command as SapphireCommand } from '@sapphire/framework'
import type { ApplicationCommandOptionData, ChatInputApplicationCommandData, PermissionResolvable } from 'discord.js'
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

	protected getOption<D extends ApplicationCommandOptionData = ApplicationCommandOptionData>( option: DistributiveOmit<ApplicationCommandOptionData, 'description' | 'descriptionLocalizations' | 'nameLocalizations'> ): D {
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

export interface CommandOptions extends PieceOptions {
	defaultMemberPermissions?: PermissionResolvable
	dm: boolean
	guildIds?: string[]
	name?: string
}

