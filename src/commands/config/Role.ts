import { ChannelTypes, copyMessage, getInteractionChannel, getInteractionGuild, type MessageButtonStyle, MessageButtonStyles, simpleEmbed } from '../../utilities'
import { Command, type CommandOptions } from '../../framework'
import { type CommandInteraction, type Message, type MessageActionRow, type MessageActionRowOptions, type MessageButtonOptions, type NewsChannel, Permissions, type TextChannel } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
import Colors from '@bitomic/material-colors'
import { chunkify } from '@bitomic/utilities'

interface IRoleButton {
	buttonStyle: MessageButtonStyle
	emoji: string | null
	label: string | null
	role: string
}

enum Subcommands {
	addbutton = 'addbutton',
	channel = 'channel',
	copymessage = 'copymessage',
	editmessage = 'editmessage',
	help = 'help',
	message = 'message',
	removebutton = 'removebutton'
}

enum SubcommandOptions {
	'addbutton-emoji' = 'addbutton-emoji',
	'addbutton-label' = 'addbutton-label',
	'addbutton-role' = 'addbutton-role',
	'addbutton-style' = 'addbutton-style',

	'copymessage-message' = 'copymessage-message',

	'channel-channel' = 'channel-channel',

	'editmessage-message' = 'editmessage-message',

	'message-message' = 'message-message',

	'removebutton-role' = 'removebutton-role'
}

@ApplyOptions<CommandOptions>( {
	defaultMemberPermissions: Permissions.FLAGS.MANAGE_GUILD,
	dm: false,
	name: 'role'
} )
export class UserCommand extends Command<Subcommands | SubcommandOptions> {
	protected override setOptions(): void {
		this.applicationCommandBase.options = [
			this.createOption( {
				name: Subcommands.help,
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.channel,
				options: [ this.createOption( {
					channelTypes: [ 'GUILD_TEXT' ],
					name: SubcommandOptions[ 'channel-channel' ],
					required: true,
					type: 'CHANNEL'
				} ) ],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.message,
				options: [ this.createOption( {
					name: SubcommandOptions[ 'message-message' ],
					required: true,
					type: 'STRING'
				} ) ],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.copymessage,
				options: [ this.createOption( {
					name: SubcommandOptions[ 'copymessage-message' ],
					required: true,
					type: 'STRING'
				} ) ],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.editmessage,
				options: [ this.createOption( {
					name: SubcommandOptions[ 'editmessage-message' ],
					required: true,
					type: 'STRING'
				} ) ],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.addbutton,
				options: [
					this.createOption( {
						name: SubcommandOptions[ 'addbutton-role' ],
						required: true,
						type: 'ROLE'
					} ),
					this.createOption( {
						name: SubcommandOptions[ 'addbutton-label' ],
						type: 'STRING'
					} ),
					this.createOption( {
						name: SubcommandOptions[ 'addbutton-emoji' ],
						type: 'STRING'
					} ),
					this.createOption( {
						choices: MessageButtonStyles,
						name: SubcommandOptions[ 'addbutton-style' ],
						type: 'STRING'
					} )
				],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.removebutton,
				options: [ this.createOption( {
					name: SubcommandOptions[ 'removebutton-role' ],
					required: true,
					type: 'ROLE'
				} ) ],
				type: 'SUB_COMMAND'
			} )
		]
	}

	public override async chatInputRun( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const subcommandMappings = {
			[ this.keysRealValues.addbutton ]: 'addButton',
			[ this.keysRealValues.help ]: 'help',
			[ this.keysRealValues.channel ]: 'setChannel',
			[ this.keysRealValues.copymessage ]: 'copyMessage',
			[ this.keysRealValues.editmessage ]: 'editMessage',
			[ this.keysRealValues.removebutton ]: 'removeButton',
			[ this.keysRealValues.message ]: 'setMessage'
		} as const

		const subcommand = interaction.options.getSubcommand( true ) as keyof typeof subcommandMappings
		await interaction.deferReply()
		const subcommandName = subcommandMappings[ subcommand ]

		if ( subcommandName ) {
			await this[ `${ subcommandName }Execute` ]( interaction )
		} else {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'default', 'unknownSubcommand' )
			} )
		}
	}

	public helpExecute( interaction: CommandInteraction<'cached' | 'raw'> ): void {
		void interaction.editReply( {
			content: 'TODO'
		} )
	}

	public async setChannelExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const channel = this.getChannel( interaction, SubcommandOptions[ 'channel-channel' ], true ) as TextChannel

		if ( !this.container.client.user ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'default', 'noBotUser' )
			} )
			return
		}

		const permissions = channel.permissionsFor( this.container.client.user, true )
		if ( !permissions?.has( 'MANAGE_WEBHOOKS' ) ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'default', 'missingChannelPermissionManageWebhooks', {
					channel: channel.id
				} )
			} )
			return
		}

		try {
			const channels = this.container.stores.get( 'models' ).get( 'channels' )
			await channels.set( {
				channel: channel.id,
				guild: interaction.guildId,
				type: ChannelTypes.Roles
			} )

			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.green.s800, 'config', 'roleChannelSuccess' )
			} )
		} catch {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'config', 'roleChannelError' )
			} )
		}
	}

	public async setMessageExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const message = await this.getInteractionMessage( interaction, SubcommandOptions[ 'message-message' ] )
		if ( !message ) return

		const userId = this.container.client.user?.id
		if ( !userId ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'default', 'noBotUser' )
			} )
			return
		}

		if ( message.author.id !== userId ) {
			const webhook = await message.fetchWebhook().catch( () => null )
			if ( webhook?.owner?.id !== userId ) {
				void interaction.editReply( {
					embeds: await simpleEmbed( interaction, Colors.amber.s800, 'config', 'roleNonOwnedMessage' )
				} )
				return
			}
		}

		const keyv = this.container.stores.get( 'models' ).get( 'keyv' )
		await keyv.set( interaction.guildId, 'roles-message', message.id )

		void interaction.editReply( {
			embeds: await simpleEmbed( interaction, Colors.amber.s800, 'config', 'roleSetMessageSuccess' )
		} )
	}

	public async copyMessageExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const message = await this.getInteractionMessage( interaction, SubcommandOptions[ 'copymessage-message' ] )
		if ( !message ) return

		const channel = await this.getRolesChannel( interaction )
		if ( !channel ) return

		try {
			await copyMessage( { channel, message } )
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.green.s800, 'config', 'roleCopyMessageSuccess' )
			} )
		} catch {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.green.s800, 'config', 'roleCopyMessageError' )
			} )
		}
	}

	public async editMessageExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const templateMessage = await this.getInteractionMessage( interaction, SubcommandOptions[ 'editmessage-message' ] )
		if ( !templateMessage ) return

		const channel = await this.getRolesChannel( interaction )
		if ( !channel ) return

		const rolesMessage = await this.getRolesMessage( interaction )
		if ( !rolesMessage ) return

		try {
			await copyMessage( {
				channel,
				message: templateMessage,
				messageToEdit: rolesMessage.id
			} )
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.green.s800, 'config', 'roleEditMessageSuccess' )
			} )
		} catch {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.green.s800, 'config', 'roleEditMessageError' )
			} )
		}
	}

	public async addButtonExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const role = this.getRole( interaction, SubcommandOptions[ 'addbutton-role' ], true )
		const label = this.getString( interaction, SubcommandOptions[ 'addbutton-label' ] )
		const emoji = this.getString( interaction, SubcommandOptions[ 'addbutton-emoji' ] )
		const buttonStyle = this.getString( interaction, SubcommandOptions[ 'addbutton-style' ] ) as MessageButtonStyle | null ?? 'SECONDARY'

		if ( !label && !emoji ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.amber.s800, 'config', 'roleAddButtonLabelOrEmoji' )
			} )
			return
		}

		if ( role.managed || role.position === 0 ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.amber.s800, 'default', 'unassignableRole', { role: role.id } )
			} )
			return
		}

		const guild = await getInteractionGuild( interaction )
		const highestRole = guild.me?.roles.highest
		if ( highestRole && highestRole.position <= role.position ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.amber.s800, 'default', 'unassignableHigherRole', { role: highestRole.id } )
			} )
			return
		}

		const rolesMessage = await this.getRolesMessage( interaction )
		if ( !rolesMessage ) return

		const button: IRoleButton = { buttonStyle, emoji, label, role: role.id }

		if ( emoji ) {
			const customEmoji = emoji.match( /<.*?:([0-9]+)>/ )?.[ 1 ]
			button.emoji = customEmoji ?? emoji
		}

		const buttons = this.getButtons( rolesMessage.components )
		if ( buttons.length >= 25 ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'config', 'roleAddButtonMaxButtons' )
			} )
			return
		}

		buttons.push( button )
		const components = this.getActionRows( buttons )

		try {
			const webhook = await rolesMessage.fetchWebhook()
			await webhook.editMessage( rolesMessage.id, {
				components
			} )

			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'config', 'roleAddButtonSuccess' )
			} )
		} catch {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'config', 'roleAddButtonError' )
			} )
		}
	}

	public async removeButtonExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const role = this.getRole( interaction, SubcommandOptions[ 'removebutton-role' ], true )

		const rolesMessage = await this.getRolesMessage( interaction )
		if ( !rolesMessage ) return

		const buttons = this.getButtons( rolesMessage.components )
		if ( buttons.length === 0 ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'config', 'roleNoButtons' )
			} )
			return
		} else if ( !buttons.find( i => i.role === role.id ) ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.red.s800, 'config', 'roleRemoveButtonNoRole', { role: role.id } )
			} )
			return
		}

		const newButtons = buttons.filter( button => button.role !== role.id )
		const components = this.getActionRows( newButtons )

		try {
			const webhook = await rolesMessage.fetchWebhook()
			await webhook.editMessage( rolesMessage.id, {
				components
			} )

			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.green.s800, 'config', 'roleRemoveButtonSuccess' )
			} )
		} catch {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.green.s800, 'config', 'roleRemoveButtonError' )
			} )
		}
	}

	protected async getInteractionMessage( interaction: CommandInteraction<'cached' | 'raw'>, option: SubcommandOptions ): Promise<Message<boolean> | null> {
		const [ messageId ] = this.getString( interaction, option, true ).match( /\d+$/ ) ?? []
		if ( !messageId ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.amber.s800, 'default', 'invalidIdentifier' )
			} )
			return null
		}

		const channel = await getInteractionChannel( interaction )
		if ( !channel.permissionsFor( this.container.client.user?.id ?? '' )?.has( 'READ_MESSAGE_HISTORY' ) ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.amber.s800, 'default', 'inaccessibleChannel', { channel: interaction.channelId } )
			} )
			return null
		}

		const message = await channel.messages.fetch( messageId )
			.catch( () => null )

		if ( !message ) {
			void interaction.editReply( {
				embeds: await simpleEmbed( interaction, Colors.amber.s800, 'default', 'messageNotFound', { channel: channel.id } )
			} )
			return null
		}

		return message
	}

	protected async getRolesChannel( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<NewsChannel | TextChannel | null> {
		const channelId = await this.container.stores.get( 'models' ).get( 'channels' )
			.get( interaction.guildId, ChannelTypes.Roles )
		if ( channelId ) {
			const guild = await getInteractionGuild( interaction )
			const channel = await guild.channels.fetch( channelId )
				.catch( () => null )
			if ( channel?.isText() && channel.type !== 'GUILD_VOICE' ) return channel
		}
		void interaction.editReply( {
			embeds: await simpleEmbed( interaction, Colors.amber.s800, 'config', 'roleChannelNotSet' )
		} )
		return null
	}

	protected async getRolesMessage( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<Message<boolean> | null> {
		const channel = await this.getRolesChannel( interaction )
		if ( channel ) {
			const messageId = await this.container.stores.get( 'models' ).get( 'keyv' )
				.get( interaction.guildId, 'roles-message' )
			if ( messageId ) {
				const message = await channel.messages.fetch( messageId )
					.catch( () => null )
				if ( message ) return message
			}
		}
		void interaction.editReply( {
			embeds: await simpleEmbed( interaction, Colors.amber.s800, 'config', 'roleMessageNotSet' )
		} )
		return null
	}

	protected getButtons( rows: MessageActionRow[] ): IRoleButton[] {
		return rows.map( row => {
			const buttons: IRoleButton[] = []
			for ( const component of row.components ) {
				if ( component.type !== 'BUTTON' || component.style === 'LINK' ) continue
				const [ , role ] = component.customId?.split( '-' ) ?? []
				if ( !role ) continue

				buttons.push( {
					buttonStyle: component.style ?? 'SECONDARY',
					emoji: component.emoji?.id ?? component.emoji?.name ?? null,
					label: component.label,
					role
				} )
			}

			return buttons
		} ).flat()
	}

	protected getActionRows( buttons: IRoleButton[] ): Array<MessageActionRowOptions & { type: 'ACTION_ROW' }> {
		const rawButtons: MessageButtonOptions[] = []
		for ( const role of buttons ) {
			const button: MessageButtonOptions = {
				customId: `role-${ role.role }`,
				style: role.buttonStyle,
				type: 'BUTTON'
			}
			if ( role.label ) button.label = role.label
			if ( role.emoji ) button.emoji = role.emoji
			rawButtons.push( button )
		}

		return chunkify( rawButtons, 5 ).map( chunk => ( {
			components: chunk,
			type: 'ACTION_ROW'
		} as MessageActionRowOptions & { type: 'ACTION_ROW' } ) )
	}
}
