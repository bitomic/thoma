import { type APIRole } from 'discord-api-types/v9'
import { ButtonIds, ChannelTypes, copyMessage, getInteractionChannel, getInteractionGuild, type MessageButtonStyle, MessageButtonStyles, RoleTypes } from '../../utilities'
import { Command, type CommandOptions } from '../../framework'
import { type CommandInteraction, type Guild, type GuildTextBasedChannel, type Message, MessageActionRow, MessageButton, type MessageEmbedOptions, Permissions, type Role, type TextChannel } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
import Colors from '@bitomic/material-colors'

enum Subcommands {
	Logs = 'logs',
	Message = 'message',
	Role = 'role'
}

enum SubcommandOptions {
	Channel = 'channel',
	Message = 'message',
	Role = 'role',
	Style = 'style'
}

@ApplyOptions<CommandOptions>( {
	defaultMemberPermissions: Permissions.FLAGS.MANAGE_GUILD,
	dm: false,
	enabled: true,
	name: 'fandom'
} )
export class UserCommand extends Command {
	protected override setOptions(): void {
		this.applicationCommandBase.options = [
			this.createOption( {
				name: Subcommands.Role,
				options: [ this.createOption( {
					name: SubcommandOptions.Role,
					required: true,
					type: 'ROLE'
				}, `${ Subcommands.Role }.options.${ SubcommandOptions.Role }` ) ],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.Message,
				options: [
					this.createOption( {
						name: SubcommandOptions.Message,
						required: true,
						type: 'STRING'
					}, `${ Subcommands.Message }.options.${ SubcommandOptions.Message }` ),
					this.createOption( {
						choices: MessageButtonStyles,
						name: SubcommandOptions.Style,
						type: 'STRING'
					}, `${ Subcommands.Message }.options.${ SubcommandOptions.Style }` )
				],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.Logs,
				options: [ this.createOption( {
					channelTypes: [ 'GUILD_TEXT' ],
					name: SubcommandOptions.Channel,
					required: true,
					type: 'CHANNEL'
				}, `${ Subcommands.Logs }.options.${ SubcommandOptions.Channel }` ) ],
				type: 'SUB_COMMAND'
			} )
		]
	}

	public override async chatInputRun( interaction: CommandInteraction ): Promise<void> {
		if ( !interaction.inGuild() ) return

		await interaction.deferReply( { ephemeral: true } )

		const subcommand = interaction.options.getSubcommand( true ) as Subcommands | null

		if ( subcommand === Subcommands.Message ) {
			const [ messageId ] = interaction.options.getString( SubcommandOptions.Message, true ).match( /\d+$/ ) ?? []
			const buttonStyle = interaction.options.getString( SubcommandOptions.Style ) as MessageButtonStyle | null

			if ( !messageId ) {
				void interaction.editReply( {
					embeds: await this.simpleEmbed( {
						category: 'default',
						color: Colors.amber.s800,
						key: 'invalidIdentifier',
						target: interaction
					} )
				} )
				return
			}

			const channel = await getInteractionChannel( interaction )
			if ( !channel.permissionsFor( this.container.client.user?.id ?? '' )?.has( 'READ_MESSAGE_HISTORY' ) ) {
				void interaction.editReply( {
					embeds: await this.simpleEmbed( {
						category: 'default',
						color: Colors.amber.s800,
						key: 'inaccessibleChannel',
						replace: { channel: interaction.channelId },
						target: interaction
					} )
				} )
				return
			}

			const message = await channel.messages.fetch( messageId )
				.catch( () => null )

			const reply = await this.copyMessage( interaction, message, channel, buttonStyle )
			void interaction.editReply( { embeds: reply } )
		} else if ( subcommand === Subcommands.Role ) {
			const guild = await getInteractionGuild( interaction )
			const role = interaction.options.getRole( SubcommandOptions.Role, true )
			const reply = await this.setRole( interaction, guild, role )
			void interaction.editReply( { embeds: reply } )
		} else if ( subcommand === Subcommands.Logs ) {
			if ( !this.container.client.user ) {
				void interaction.editReply( {
					embeds: await this.simpleEmbed( {
						category: 'default',
						color: Colors.amber.s800,
						key: 'noBotUser',
						target: interaction
					} )
				} )
				return
			}
			const channel = interaction.options.getChannel( SubcommandOptions.Channel, true ) as TextChannel
			const permissions = channel.permissionsFor( this.container.client.user, true )
			if ( !permissions?.has( 'SEND_MESSAGES' ) ) {
				void interaction.editReply( {
					embeds: await this.simpleEmbed( {
						category: 'default',
						color: Colors.amber.s800,
						key: 'inaccessibleChannel',
						replace: { channel: interaction.channelId },
						target: interaction
					} )
				} )
				return
			}

			const channels = this.container.stores.get( 'models' ).get( 'channels' )
			await channels.set( {
				channel: channel.id,
				guild: interaction.guildId,
				type: ChannelTypes.Logs
			} )
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.green.s800,
					key: 'setLogsChannelSuccess',
					replace: { channel: channel.id },
					target: interaction
				} )
			} )
			void channel.send( {
				embeds: await this.simpleEmbed( {
					color: Colors.green.s800,
					key: 'setLogsChannelTest',
					replace: { user: interaction.user.id },
					target: interaction
				} )
			} )
		} else {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					category: 'default',
					color: Colors.red.s800,
					key: 'unknownSubcommand',
					target: interaction
				} )
			} )
		}
	}

	public async copyMessage( interaction: CommandInteraction, message: Message | null, channel: GuildTextBasedChannel, buttonStyle?: MessageButtonStyle | null ): Promise<[ MessageEmbedOptions ]> {
		if ( !message ) {
			return this.simpleEmbed( {
				category: 'default',
				color: Colors.amber.s800,
				key: 'messageNotFound',
				replace: { channel: channel.id },
				target: interaction
			} )
		}

		try {
			const button = new MessageButton( {
				customId: ButtonIds.FandomVerify,
				emoji: 'fandomflame:872100256999952436',
				label: 'Verificar',
				style: buttonStyle ?? 'SUCCESS',
				type: 'BUTTON'
			} )
			await copyMessage( {
				channel,
				components: [ new MessageActionRow( { components: [ button ] } ) ],
				message
			} )
			return this.simpleEmbed( {
				color: Colors.green.s800,
				key: 'copyMessageSuccess',
				target: interaction
			} )
		} catch {
			return this.simpleEmbed( {
				color: Colors.red.s800,
				key: 'copyMessageError',
				target: interaction
			} )
		}
	}

	public async setRole( interaction: CommandInteraction, guild: Guild, role: Role | APIRole ): Promise<[MessageEmbedOptions]> {
		if ( role.managed || role.position === 0 ) {
			return this.simpleEmbed( {
				category: 'default',
				color: Colors.red.s800,
				key: 'unassignableRole',
				replace: { role: role.id },
				target: interaction
			} )
		}

		const highestRole = guild.me?.roles.highest
		if ( highestRole && highestRole.position <= role.position ) {
			return this.simpleEmbed( {
				category: 'default',
				color: Colors.red.s800,
				key: 'unassignableHigherRole',
				replace: { role: highestRole.id },
				target: interaction
			} )
		}

		const roles = this.container.stores.get( 'models' ).get( 'roles' )

		try {
			await roles.set( {
				guild: guild.id,
				role: role.id,
				type: RoleTypes.Fandom
			} )
			return this.simpleEmbed( {
				color: Colors.green.s800,
				key: 'setupSuccess',
				replace: { role: role.id },
				target: interaction
			} )
		} catch {
			return this.simpleEmbed( {
				color: Colors.red.s800,
				key: 'setupError',
				target: interaction
			} )
		}
	}
}
