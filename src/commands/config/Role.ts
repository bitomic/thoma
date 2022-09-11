import { ChannelTypes, copyMessage, getInteractionChannel, getInteractionGuild, getInteractionMember, type MessageButtonStyle, MessageButtonStyles } from '../../utilities'
import { Command, type CommandOptions } from '../../framework'
import { type CommandInteraction, type Message, type MessageActionRow, type MessageActionRowOptions, type MessageButtonOptions, type NewsChannel, Permissions, type TextChannel } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
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
			this.getOption( {
				name: Subcommands.help,
				type: 'SUB_COMMAND'
			} ),
			this.getOption( {
				name: Subcommands.channel,
				options: [ this.getOption( {
					channelTypes: [ 'GUILD_TEXT' ],
					name: SubcommandOptions[ 'channel-channel' ],
					required: true,
					type: 'CHANNEL'
				} ) ],
				type: 'SUB_COMMAND'
			} ),
			this.getOption( {
				name: Subcommands.message,
				options: [ this.getOption( {
					name: SubcommandOptions[ 'message-message' ],
					required: true,
					type: 'STRING'
				} ) ],
				type: 'SUB_COMMAND'
			} ),
			this.getOption( {
				name: Subcommands.copymessage,
				options: [ this.getOption( {
					name: SubcommandOptions[ 'copymessage-message' ],
					required: true,
					type: 'STRING'
				} ) ],
				type: 'SUB_COMMAND'
			} ),
			this.getOption( {
				name: Subcommands.editmessage,
				options: [ this.getOption( {
					name: SubcommandOptions[ 'editmessage-message' ],
					required: true,
					type: 'STRING'
				} ) ],
				type: 'SUB_COMMAND'
			} ),
			this.getOption( {
				name: Subcommands.addbutton,
				options: [
					this.getOption( {
						name: SubcommandOptions[ 'addbutton-role' ],
						required: true,
						type: 'ROLE'
					} ),
					this.getOption( {
						name: SubcommandOptions[ 'addbutton-label' ],
						type: 'STRING'
					} ),
					this.getOption( {
						name: SubcommandOptions[ 'addbutton-emoji' ],
						type: 'STRING'
					} ),
					this.getOption( {
						choices: MessageButtonStyles,
						name: SubcommandOptions[ 'addbutton-style' ],
						type: 'STRING'
					} )
				],
				type: 'SUB_COMMAND'
			} ),
			this.getOption( {
				name: Subcommands.removebutton,
				options: [ this.getOption( {
					name: SubcommandOptions[ 'removebutton-role' ],
					required: true,
					type: 'ROLE'
				} ) ],
				type: 'SUB_COMMAND'
			} )
		]
	}

	public override async chatInputRun( interaction: CommandInteraction ): Promise<void> {
		if ( !interaction.inGuild() ) return

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

		if ( subcommand !== 'ayuda' ) {
			const member = await getInteractionMember( interaction )
			if ( !member.permissions.has( 'MANAGE_GUILD' ) ) {
				void interaction.reply( {
					content: 'No tienes permiso para usar este comando.',
					ephemeral: true
				} )
				return
			}
		}

		await interaction.deferReply()
		const subcommandName = subcommandMappings[ subcommand ]
		if ( subcommandName ) {
			await this[ `${ subcommandName }Execute` ]( interaction )
		} else {
			void interaction.editReply( {
				content: 'Has intentado usar un comando que no reconozco.'
			} )
		}
	}

	public helpExecute( interaction: CommandInteraction<'cached' | 'raw'> ): void {
		void interaction.editReply( {
			content: 'TODO'
		} )
	}

	public async setChannelExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const channel = interaction.options.getChannel( 'canal', true )
		try {
			await this.container.stores.get( 'models' ).get( 'channels' )
				.set( {
					channel: channel.id,
					guild: interaction.guildId,
					type: ChannelTypes.Roles
				} )
			void interaction.editReply( {
				content: 'Se ha configurado el canal exitosamente.'
			} )
		} catch {
			void interaction.editReply( {
				content: 'Ocurrió un error al intentar guardar el canal.'
			} )
		}
	}

	public async setMessageExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const message = await this.getInteractionMessage( interaction )
		if ( !message ) return

		const userId = this.container.client.user?.id
		if ( !userId ) {
			void interaction.editReply( {
				content: 'Ha ocurrido un error interno. Vuelve a intentarlo en unos segundos.'
			} )
			return
		}

		if ( message.author.id !== userId ) {
			const webhook = await message.fetchWebhook().catch( () => null )
			if ( webhook?.owner?.id !== userId ) {
				void interaction.editReply( {
					content: 'Estás intentando modificar un mensaje que no fue enviado por el bot.'
				} )
				return
			}
		}

		await this.container.stores.get( 'models' ).get( 'keyv' )
			.set( interaction.guildId, 'roles-message', message.id )
		void interaction.editReply( {
			content: 'Se ha establecido el mensaje a modificar exitosamente.'
		} )
	}

	public async copyMessageExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const message = await this.getInteractionMessage( interaction )
		if ( !message ) return

		const channel = await this.getRolesChannel( interaction )
		if ( !channel ) return

		try {
			await copyMessage( { channel, message } )
			void interaction.editReply( {
				content: 'Se ha copiado el mensaje exitosamente.'
			} )
		} catch {
			void interaction.editReply( {
				content: 'Ha ocurrido un error inesperado al intentar copiar el mensaje.'
			} )
		}
	}

	public async editMessageExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const templateMessage = await this.getInteractionMessage( interaction )
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
				content: 'Se ha editado el mensaje exitosamente.'
			} )
		} catch {
			void interaction.editReply( {
				content: 'Ha ocurrido un error al intentar editar el mensaje.'
			} )
		}
	}

	public async addButtonExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const role = interaction.options.getRole( 'rol', true )
		const label = interaction.options.getString( 'etiqueta' )
		const emoji = interaction.options.getString( 'emoji' )
		const buttonStyle = interaction.options.getString( 'estilo' ) as MessageButtonStyle | null ?? 'SECONDARY'

		if ( !label && !emoji ) {
			void interaction.editReply( {
				content: 'Debes especificar al menos la etiqueta o emoji.'
			} )
			return
		}

		if ( role.managed || role.position === 0 ) {
			void interaction.editReply( {
				content: `El rol de <@&${ role.id }> no puede ser asignado.`
			} )
			return
		}

		const guild = await getInteractionGuild( interaction )
		const highestRole = guild.me?.roles.highest
		if ( highestRole && highestRole.position <= role.position ) {
			void interaction.editReply( {
				content: `Solo puedo asignar roles por debajo de mi rol más alto, que es <@&${ highestRole.id }>.`
			} )
			return
		}

		const rolesMessage = await this.getRolesMessage( interaction )
		if ( !rolesMessage ) return

		const button: IRoleButton = {
			buttonStyle,
			emoji,
			label,
			role: role.id
		}

		if ( emoji ) {
			const customEmoji = emoji.match( /<.*?:([0-9]+)>/ )?.[ 1 ]
			button.emoji = customEmoji ?? emoji
		}

		const buttons = this.getButtons( rolesMessage.components )
		if ( buttons.length >= 25 ) {
			void interaction.editReply( {
				content: 'El mensaje seleccionado ya tiene el número máximo de botones permitidos (25).'
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
				content: 'Se ha añadido el botón exitosamente.'
			} )
		} catch {
			void interaction.editReply( {
				content: 'Ha ocurrido un error al intentar editar el mensaje.'
			} )
		}
	}

	public async removeButtonExecute( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<void> {
		const role = interaction.options.getRole( 'rol', true )

		const rolesMessage = await this.getRolesMessage( interaction )
		if ( !rolesMessage ) return

		const buttons = this.getButtons( rolesMessage.components )
		if ( buttons.length === 0 ) {
			void interaction.editReply( {
				content: 'El mensaje no tiene botones para eliminar.'
			} )
			return
		} else if ( !buttons.find( i => i.role === role.id ) ) {
			void interaction.editReply( {
				content: `No hay ningún botón configurado para <@&${ role.id }>.`
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
				content: 'Se ha eliminado el botón exitosamente.'
			} )
		} catch {
			void interaction.editReply( {
				content: 'Ha ocurrido un error al intentar editar el mensaje.'
			} )
		}
	}

	protected async getInteractionMessage( interaction: CommandInteraction<'cached' | 'raw'> ): Promise<Message<boolean> | null> {
		const [ messageId ] = interaction.options.getString( 'mensaje', true ).match( /\d+$/ ) ?? []
		if ( !messageId ) {
			void interaction.editReply( {
				content: 'No has especificado un identificador válido.'
			} )
			return null
		}

		const channel = await getInteractionChannel( interaction )
		if ( !channel ) {
			void interaction.editReply( {
				content: 'No tengo acceso al canal donde has usado el comando.'
			} )
			return null
		}

		const message = await channel.messages.fetch( messageId )
			.catch( () => null )

		if ( !message ) {
			void interaction.editReply( {
				content: `No he encontrado el mensaje en <#${ channel.id }>`
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
			content: 'No has configurado el canal de roles.'
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
			content: 'No hay seleccionado un mensaje para modificar.'
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
