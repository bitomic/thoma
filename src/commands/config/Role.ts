import { ButtonIds, ChannelTypes, copyMessage, getInteractionChannel, getInteractionGuild, type MessageButtonStyle, MessageButtonStyles } from '../../utilities'
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
	AddButton = 'add-button',
	Channel = 'channel',
	CopyMessage = 'copy-message',
	EditMessage = 'edit-message',
	Help = 'help',
	Message = 'message',
	RemoveButton = 'remove-button'
}

enum SubcommandOptions {
	Channel = 'channel',
	Emoji = 'emoji',
	Label = 'label',
	Message = 'message',
	Role = 'role',
	Style = 'style'
}

@ApplyOptions<CommandOptions>( {
	defaultMemberPermissions: Permissions.FLAGS.MANAGE_GUILD,
	dm: false,
	name: 'role'
} )
export class UserCommand extends Command {
	protected override setOptions(): void {
		this.applicationCommandBase.options = [
			this.createOption( {
				name: Subcommands.Help,
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.Channel,
				options: [ this.createOption( {
					channelTypes: [ 'GUILD_TEXT' ],
					name: SubcommandOptions.Channel,
					required: true,
					type: 'CHANNEL'
				}, `${ Subcommands.Channel }.options.${ SubcommandOptions.Channel }` ) ],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.Message,
				options: [ this.createOption( {
					name: SubcommandOptions.Message,
					required: true,
					type: 'STRING'
				}, `${ Subcommands.Channel }.options.${ SubcommandOptions.Channel }` ) ],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.CopyMessage,
				options: [ this.createOption( {
					name: SubcommandOptions.Message,
					required: true,
					type: 'STRING'
				}, `${ Subcommands.CopyMessage }.options.${ SubcommandOptions.Message }` ) ],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.EditMessage,
				options: [ this.createOption( {
					name: SubcommandOptions.Message,
					required: true,
					type: 'STRING'
				}, `${ Subcommands.EditMessage }.options.${ SubcommandOptions.Message }` ) ],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.AddButton,
				options: [
					this.createOption( {
						name: SubcommandOptions.Role,
						required: true,
						type: 'ROLE'
					}, `${ Subcommands.AddButton }.options.${ SubcommandOptions.Role }` ),
					this.createOption( {
						name: SubcommandOptions.Label,
						type: 'STRING'
					}, `${ Subcommands.AddButton }.options.${ SubcommandOptions.Label }` ),
					this.createOption( {
						name: SubcommandOptions.Emoji,
						type: 'STRING'
					}, `${ Subcommands.AddButton }.options.${ SubcommandOptions.Emoji }` ),
					this.createOption( {
						choices: MessageButtonStyles,
						name: SubcommandOptions.Style,
						type: 'STRING'
					}, `${ Subcommands.AddButton }.options.${ SubcommandOptions.Style }` )
				],
				type: 'SUB_COMMAND'
			} ),
			this.createOption( {
				name: Subcommands.RemoveButton,
				options: [ this.createOption( {
					name: SubcommandOptions.Role,
					required: true,
					type: 'ROLE'
				}, `${ Subcommands.RemoveButton }.options.${ SubcommandOptions.Role }` ) ],
				type: 'SUB_COMMAND'
			} )
		]
	}

	public override async chatInputRun( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const subcommandMappings = {
			[ Subcommands.AddButton ]: 'addButton',
			[ Subcommands.Help ]: 'help',
			[ Subcommands.Channel ]: 'setChannel',
			[ Subcommands.CopyMessage ]: 'copyMessage',
			[ Subcommands.EditMessage ]: 'editMessage',
			[ Subcommands.RemoveButton ]: 'removeButton',
			[ Subcommands.Message ]: 'setMessage'
		} as const

		const subcommand = interaction.options.getSubcommand( true ) as keyof typeof subcommandMappings
		await interaction.deferReply()
		const subcommandName = subcommandMappings[ subcommand ]

		if ( subcommandName ) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
			await this[ `${ subcommandName }Execute` ]( interaction )
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

	public helpExecute( interaction: CommandInteraction<'cached' | 'raw'> ): void {
		void interaction.editReply( {
			content: 'TODO'
		} )
	}

	public async setChannelExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const channel = interaction.options.getChannel( SubcommandOptions.Channel, true ) as TextChannel

		if ( !this.container.client.user ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					category: 'default',
					color: Colors.red.s800,
					key: 'noBotUser',
					target: interaction
				} )
			} )
			return
		}

		const permissions = channel.permissionsFor( this.container.client.user, true )
		if ( !permissions?.has( 'MANAGE_WEBHOOKS' ) ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					category: 'permissions',
					color: Colors.red.s800,
					key: 'manageWebhooks',
					replace: { channel: channel.id },
					target: interaction
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
				embeds: await this.simpleEmbed( {
					color: Colors.green.s800,
					key: 'roleChannelSuccess',
					target: interaction
				} )
			} )
		} catch ( e ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.red.s800,
					key: 'roleChannelError',
					target: interaction
				} )
			} )
		}
	}

	public async setMessageExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const message = await this.getInteractionMessage( interaction, SubcommandOptions.Message )
		if ( !message ) return

		const userId = this.container.client.user?.id
		if ( !userId ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					category: 'default',
					color: Colors.red.s800,
					key: 'noBotUser',
					target: interaction
				} )
			} )
			return
		}

		if ( message.author.id !== userId ) {
			const webhook = await message.fetchWebhook().catch( () => null )
			if ( webhook?.owner?.id !== userId ) {
				void interaction.editReply( {
					embeds: await this.simpleEmbed( {
						color: Colors.amber.s800,
						key: 'roleNonOwnedMessage',
						target: interaction
					} )
				} )
				return
			}
		}

		const keyv = this.container.stores.get( 'models' ).get( 'keyv' )
		await keyv.set( interaction.guildId, 'roles-message', message.id )

		void interaction.editReply( {
			embeds: await this.simpleEmbed( {
				color: Colors.green.s800,
				key: 'roleSetMessageSuccess',
				target: interaction
			} )
		} )
	}

	public async copyMessageExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const message = await this.getInteractionMessage( interaction, SubcommandOptions.Message )
		if ( !message ) return

		const channel = await this.getRolesChannel( interaction )
		if ( !channel ) return

		try {
			await copyMessage( { channel, message } )
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.green.s800,
					key: 'roleCopyMessageSuccess',
					target: interaction
				} )
			} )
		} catch {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.red.s800,
					key: 'roleCopyMessageError',
					target: interaction
				} )
			} )
		}
	}

	public async editMessageExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const templateMessage = await this.getInteractionMessage( interaction, SubcommandOptions.Message )
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
				embeds: await this.simpleEmbed( {
					color: Colors.green.s800,
					key: 'roleEditMessageSuccess',
					target: interaction
				} )
			} )
		} catch {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.red.s800,
					key: 'roleEditMessageError',
					target: interaction
				} )
			} )
		}
	}

	public async addButtonExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const role = interaction.options.getRole( SubcommandOptions.Role, true )
		const label = interaction.options.getString( SubcommandOptions.Label )
		const emoji = interaction.options.getString( SubcommandOptions.Emoji )
		const buttonStyle = interaction.options.getString( SubcommandOptions.Style ) as MessageButtonStyle | null ?? 'SECONDARY'

		if ( !label && !emoji ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.amber.s800,
					key: 'roleAddButtonLabelOrEmoji',
					target: interaction
				} )
			} )
			return
		}

		if ( role.managed || role.position === 0 ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					category: 'default',
					color: Colors.amber.s800,
					key: 'unassignableRole',
					replace: { role: role.id },
					target: interaction
				} )
			} )
			return
		}

		const guild = await getInteractionGuild( interaction )
		const highestRole = guild.me?.roles.highest
		if ( highestRole && highestRole.position <= role.position ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					category: 'default',
					color: Colors.amber.s800,
					key: 'unassignableHigherRole',
					replace: { role: highestRole.id },
					target: interaction
				} )
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
				embeds: await this.simpleEmbed( {
					color: Colors.red.s800,
					key: 'roleAddButtonMaxButtons',
					target: interaction
				} )
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
				embeds: await this.simpleEmbed( {
					color: Colors.green.s800,
					key: 'roleAddButtonSuccess',
					target: interaction
				} )
			} )
		} catch {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.red.s800,
					key: 'roleAddButtonError',
					target: interaction
				} )
			} )
		}
	}

	public async removeButtonExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const role = interaction.options.getRole( SubcommandOptions.Role, true )

		const rolesMessage = await this.getRolesMessage( interaction )
		if ( !rolesMessage ) return

		const buttons = this.getButtons( rolesMessage.components )
		if ( buttons.length === 0 ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.red.s800,
					key: 'roleNoButtons',
					target: interaction
				} )
			} )
			return
		} else if ( !buttons.find( i => i.role === role.id ) ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.red.s800,
					key: 'roleRemoveButtonNoRole',
					replace: { role: role.id },
					target: interaction
				} )
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
				embeds: await this.simpleEmbed( {
					color: Colors.green.s800,
					key: 'roleRemoveButtonSuccess',
					target: interaction
				} )
			} )
		} catch {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					color: Colors.red.s800,
					key: 'roleRemoveButtonError',
					target: interaction
				} )
			} )
		}
	}

	protected async getInteractionMessage( interaction: CommandInteraction<'cached' | 'raw'>, option: SubcommandOptions ): Promise<Message<boolean> | null> {
		const [ messageId ] = interaction.options.getString( option, true ).match( /\d+$/ ) ?? []
		if ( !messageId ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					category: 'default',
					color: Colors.amber.s800,
					key: 'invalidIdentifier',
					target: interaction
				} )
			} )
			return null
		}

		const channel = await getInteractionChannel( interaction )
		if ( !channel.permissionsFor( this.container.client.user?.id ?? '' )?.has( 'READ_MESSAGE_HISTORY' ) ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					category: 'default',
					color: Colors.red.s800,
					key: 'inaccessibleChannel',
					replace: { channel: interaction.channelId },
					target: interaction
				} )
			} )
			return null
		}

		const message = await channel.messages.fetch( messageId )
			.catch( () => null )

		if ( !message ) {
			void interaction.editReply( {
				embeds: await this.simpleEmbed( {
					category: 'default',
					color: Colors.amber.s800,
					key: 'messageNotFound',
					replace: { channel: interaction.channelId },
					target: interaction
				} )
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
			embeds: await this.simpleEmbed( {
				color: Colors.amber.s800,
				key: 'roleChannelNotSet',
				target: interaction
			} )
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
			embeds: await this.simpleEmbed( {
				color: Colors.amber.s800,
				key: 'roleMessageNotSet',
				target: interaction
			} )
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
				customId: `${ ButtonIds.Role }-${ role.role }`,
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
