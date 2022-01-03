import type { ApplicationCommandData, ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, Guild, InteractionReplyOptions, TextBasedChannel } from 'discord.js'
import type { Awaitable } from '@sapphire/utilities'
import { Piece } from '@sapphire/framework'
import type { PieceContext } from '@sapphire/framework'

export abstract class SlashCommand extends Piece {
	public readonly commandData: SlashCommandOptions
	public readonly guilds: string[]

	public constructor( context: PieceContext, options: SlashCommandOptions ) {
		super( context, options )

		this.commandData = {
			defaultPermission: options.defaultPermission ?? true,
			description: options.description ?? 'No description provided',
			name: this.name,
			options: options.options ?? [],
			permissions: options.permissions ?? []
		}

		this.guilds = options.guilds || []
	}

	public abstract run( interaction: CommandInteraction ): Awaitable<unknown>

	protected inGuildChannel( interaction: CommandInteraction ): interaction is CommandInteraction<'present'> & { channel: TextBasedChannel, guild: Guild } {
		if ( !interaction.inGuild() || !interaction.channel || !interaction.guild ) {
			void this.reply( interaction, {
				content: 'You can only use this command in a guild.'
			} )
			return false
		}
		return true
	}

	protected reply( interaction: CommandInteraction, options: InteractionReplyOptions ): void {
		const method = interaction.replied || interaction.deferred
			? 'editReply'
			: 'reply'
		void interaction[ method ]( options )
	}
}

export type SlashCommandOptions = ApplicationCommandData & {
	defaultPermission?: boolean
	description?: string
	enabled?: boolean
	guilds?: string[]
	options?: ApplicationCommandOptionData[]
	permissions?: ApplicationCommandPermissionData[]
}
