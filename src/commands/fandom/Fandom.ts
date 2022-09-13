import { type APIRole } from 'discord-api-types/v9'
import { ChannelTypes, copyMessage, getInteractionChannel, getInteractionGuild, type MessageButtonStyle, MessageButtonStyles, RoleTypes, simpleEmbed } from '../../utilities'
import { Command, type CommandOptions } from '../../framework'
import { type CommandInteraction, type Guild, type GuildTextBasedChannel, type Message, MessageActionRow, MessageButton, type MessageEmbedOptions, Permissions, type Role, type TextChannel } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
import Colors from '@bitomic/material-colors'

enum Subcommands {
	logs = 'logs',
	message = 'message',
	role = 'role'
}

enum SubcommandOptions {
	'logs-channel' = 'logs-channel',

	'message-message' = 'message-message',
	'message-style' = 'message-style',

	'role-role' = 'role-role'
}

@ApplyOptions<CommandOptions>( {
	defaultMemberPermissions: Permissions.FLAGS.MANAGE_GUILD,
	dm: false,
	enabled: true,
	name: 'fandom'
} )
export class UserCommand extends Command<Subcommands | SubcommandOptions> {
	protected override setOptions(): void {
		this.applicationCommandBase.options = [
			this.createOption( {
				name: Subcommands.role,
				options: [ this.createOption( {
					name: SubcommandOptions[ 'role-role' ],
					required: true,
					type: 'ROLE'
				} ) ],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.message,
				options: [
					this.createOption( {
						name: SubcommandOptions[ 'message-message' ],
						required: true,
						type: 'STRING'
					} ),
					this.createOption( {
						choices: MessageButtonStyles,
						name: SubcommandOptions[ 'message-style' ],
						type: 'STRING'
					} )
				],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.logs,
				options: [ this.createOption( {
					channelTypes: [ 'GUILD_TEXT' ],
					name: SubcommandOptions[ 'logs-channel' ],
					required: true,
					type: 'CHANNEL'
				} ) ],
				type: 'SUB_COMMAND'
			} )
		]
	}

	public override async chatInputRun( interaction: CommandInteraction ): Promise<void> {
		if ( !interaction.inGuild() ) return

		await interaction.deferReply( { ephemeral: true } )

		const subcommand = interaction.options.getSubcommand( true ) as Subcommands | null

		if ( subcommand === Subcommands.message ) {
			const [ messageId ] = this.getString( interaction, SubcommandOptions[ 'message-message' ], true ).match( /\d+$/ ) ?? []
			const buttonStyle = this.getString( interaction, SubcommandOptions[ 'message-style' ] ) as MessageButtonStyle | null

			if ( !messageId ) {
				void interaction.editReply( {
					embeds: await simpleEmbed( interaction, Colors.amber.s800, 'default', 'invalidIdentifier' )
				} )
				return
			}

			const channel = await getInteractionChannel( interaction )
			if ( !channel.permissionsFor( this.container.client.user?.id ?? '' )?.has( 'READ_MESSAGE_HISTORY' ) ) {
				void interaction.editReply( {
					embeds: await simpleEmbed( interaction, Colors.amber.s800, 'default', 'inaccessibleChannel', { channel: interaction.channelId } )
				} )
				return
			}

			const message = await channel.messages.fetch( messageId )
				.catch( () => null )

			const reply = await this.copyMessage( interaction, message, channel, buttonStyle )
			void interaction.editReply( { embeds: reply } )
		} else if ( subcommand === Subcommands.role ) {
			const guild = await getInteractionGuild( interaction )
			const role = this.getRole( interaction, SubcommandOptions[ 'role-role' ], true )
			const reply = await this.setRole( interaction, guild, role )
			void interaction.editReply( { embeds: reply } )
		} else if ( subcommand === Subcommands.logs ) {
			if ( !this.container.client.user ) {
				void interaction.editReply( {
					embeds: await simpleEmbed( interaction, Colors.amber.s800, 'default', 'noBotUser' )
				} )
				return
			}
			const channel = this.getChannel( interaction, SubcommandOptions[ 'logs-channel' ], true ) as TextChannel
			const permissions = channel.permissionsFor( this.container.client.user, true )
			if ( !permissions?.has( 'SEND_MESSAGES' ) ) {
				void interaction.editReply( {
					embeds: await simpleEmbed( interaction, Colors.amber.s800, 'default', 'inaccessibleChannel', { channel: interaction.channelId } )
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
				embeds: await simpleEmbed( interaction, Colors.green.s800, 'fandom', 'setLogsChannelSuccess', { channel: channel.id } )
			} )
			void channel.send( {
				embeds: await simpleEmbed( interaction, Colors.green.s800, 'fandom', 'setLogsChannelTest', { user: interaction.user.id } )
			} )
		} else {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'default', 'unknownSubcommand' )
			} )
		}
	}

	public async copyMessage( interaction: CommandInteraction, message: Message | null, channel: GuildTextBasedChannel, buttonStyle?: MessageButtonStyle | null ): Promise<[ MessageEmbedOptions ]> {
		if ( !message ) {
			return simpleEmbed( interaction, Colors.amber.s800, 'default', 'messageNotFound', { channel: channel.id } )
		}

		try {
			const button = new MessageButton( {
				customId: 'fandom-verify',
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
			return simpleEmbed( interaction, Colors.green.s800, 'fandom', 'copyMessageSuccess' )
		} catch {
			return simpleEmbed( interaction, Colors.green.s800, 'fandom', 'copyMessageError' )
		}
	}

	public async setRole( interaction: CommandInteraction, guild: Guild, role: Role | APIRole ): Promise<[MessageEmbedOptions]> {
		if ( role.managed || role.position === 0 ) {
			return simpleEmbed( interaction, Colors.red.s800, 'default', 'unassignableRole', { role: role.id } )
		}

		const highestRole = guild.me?.roles.highest
		if ( highestRole && highestRole.position <= role.position ) {
			return simpleEmbed( interaction, Colors.red.s800, 'default', 'unassignableRole', { role: highestRole.id } )
		}

		const roles = this.container.stores.get( 'models' ).get( 'roles' )

		try {
			await roles.set( {
				guild: guild.id,
				role: role.id,
				type: RoleTypes.Fandom
			} )
			return simpleEmbed( interaction, Colors.green.s800, 'fandom', 'setupSuccess', { role: role.id } )
		} catch {
			return simpleEmbed( interaction, Colors.red.s800, 'fandom', 'setupError' )
		}
	}
}
