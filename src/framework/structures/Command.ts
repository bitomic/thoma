import { type ApplicationCommandRegistry, type Args, type Awaitable, type PieceContext, Command as SapphireCommand, type CommandOptions as SapphireCommandOptions } from '@sapphire/framework'
import type { Target } from '@sapphire/plugin-i18next'
import type { ApplicationCommandOptionData, ChatInputApplicationCommandData, MessageEmbedOptions, PermissionResolvable } from 'discord.js'
import { type DistributiveOmit, getCommand, getCommandI18n, simpleEmbed } from '../../utilities'

export abstract class Command<ApplicationCommand extends boolean = true> extends SapphireCommand<Args, CommandOptions> {
	protected readonly applicationCommandBase: ApplicationCommand extends true ? ChatInputApplicationCommandData : ChatInputApplicationCommandData | null

	public constructor( context: PieceContext, options: CommandOptions ) {
		super( context, options )
		this.applicationCommandBase = {
			...getCommand( {
				category: this.category,
				command: this.name
			} ),
			defaultMemberPermissions: options.defaultMemberPermissions ?? null,
			descriptionLocalizations: getCommandI18n( this.category, this.name, 'description' ),
			dmPermission: options.dm,
			nameLocalizations: getCommandI18n( this.category, this.name, 'name' )
		}
	}

	protected createOption<D extends ApplicationCommandOptionData = ApplicationCommandOptionData>( option: DistributiveOmit<ApplicationCommandOptionData, 'description' | 'descriptionLocalizations' | 'nameLocalizations'>, key?: string ): D {
		const i18nKey = `${ this.name }.options.${ key ?? option.name }`
		const command = getCommand( { category: this.category, command: i18nKey } )
		const localizations = {
			descriptionLocalizations: getCommandI18n( this.category, i18nKey, 'description' ),
			nameLocalizations: getCommandI18n( this.category, i18nKey, 'name' )
		}
		return Object.assign(
			command,
			option,
			localizations
		) as unknown as D
	}

	protected async getRegisterOptions(): Promise<ApplicationCommandRegistry.RegisterOptions> {
		return {
			...await this.container.stores.get( 'models' ).get( 'commands' )
				.getData( this.name ),
			guildIds: this.options.guildIds ?? []
		}
	}

	public override async registerApplicationCommands( registry: ApplicationCommandRegistry ): Promise<void> {
		await this.setOptions()

		if ( this.applicationCommandBase ) {
			registry.registerChatInputCommand( this.applicationCommandBase, await this.getRegisterOptions() )
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	protected setOptions(): Awaitable<void> {}

	protected simpleEmbed( options: { category?: string, color: number, key: string, replace?: Record<string, unknown>, target: Target } ): Promise<[MessageEmbedOptions]> {
		return simpleEmbed( {
			...options,
			category: options.category ?? this.category ?? 'default'
		} )
	}
}

export interface CommandOptions extends SapphireCommandOptions {
	defaultMemberPermissions?: PermissionResolvable
	dm: boolean
	guildIds?: string[]
	name?: string
}

