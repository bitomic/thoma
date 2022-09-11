import { type APIRole } from 'discord-api-types/v9'
import { ChannelTypes, copyMessage, getInteractionChannel, getInteractionGuild, type MessageButtonStyle, MessageButtonStyles, RoleTypes } from '../../utilities'
import { Command, type CommandOptions } from '../../framework'
import { type CommandInteraction, type Guild, type GuildTextBasedChannel, type Message, MessageActionRow, MessageButton, Permissions, type Role, type TextChannel } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'

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
			this.getOption( {
				name: Subcommands.role,
				options: [ this.getOption( {
					name: SubcommandOptions[ 'role-role' ],
					required: true,
					type: 'ROLE'
				} ) ],
				type: 'SUB_COMMAND'
			} ),
			this.getOption( {
				name: Subcommands.message,
				options: [
					this.getOption( {
						name: SubcommandOptions[ 'message-message' ],
						required: true,
						type: 'STRING'
					} ),
					this.getOption( {
						choices: MessageButtonStyles,
						name: SubcommandOptions[ 'message-style' ],
						type: 'STRING'
					} )
				],
				type: 'SUB_COMMAND'
			} ),
			this.getOption( {
				name: Subcommands.logs,
				options: [ this.getOption( {
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

		const subcommand = interaction.options.getSubcommand( true ) as 'mensaje' | 'rol' | null

		if ( subcommand === 'mensaje' ) {
			const [ messageId ] = interaction.options.getString( 'mensaje', true ).match( /\d+$/ ) ?? []
			const buttonStyle = interaction.options.getString( 'estilo' ) as MessageButtonStyle | null

			if ( !messageId ) {
				void interaction.editReply( {
					content: 'No has especificado un ID de mensaje válido. Puedes copiar su ID con click derecho si tienes el modo desarrollador activado, o puedes copiar el enlace del mensaje y usarlo como argumento del comando.'
				} )
				return
			}

			const channel = await getInteractionChannel( interaction )
			if ( !channel ) {
				void interaction.editReply( {
					content: 'No tengo acceso al canal donde has usado el comando.'
				} )
				return
			}

			const message = await channel.messages.fetch( messageId )
				.catch( () => null )

			const reply = await this.copyMessage( message, channel, buttonStyle )
			void interaction.editReply( reply )
		} else if ( subcommand === 'rol' ) {
			const guild = await getInteractionGuild( interaction )
			const role = interaction.options.getRole( 'rol', true )
			const reply = await this.setRole( guild, role )
			void interaction.editReply( reply )
		} else if ( subcommand === 'registros' ) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
			if ( !this.container.client.user ) {
				void interaction.editReply( {
					content: 'Ha ocurrido un error, es posible que el bot todavía esté inicializándose...'
				} )
				return
			}
			const channel = interaction.options.getChannel( 'canal', true ) as TextChannel
			const permissions = channel.permissionsFor( this.container.client.user, true )
			if ( !permissions?.has( 'SEND_MESSAGES' ) ) {
				void interaction.editReply( {
					content: `No tengo permisos para enviar mensajes en <#${ channel.id }>.`
				} )
				return
			}

			await this.container.stores.get( 'models' ).get( 'channels' )
				.set( {
					channel: channel.id,
					guild: interaction.guildId,
					type: ChannelTypes.Logs
				} )
			void interaction.editReply( {
				content: `Configuración guardada exitosamente. Enviaré un mensaje de prueba en <#${ channel.id }>.`
			} )
			void channel.send( {
				content: `¡Hola! <@!${ interaction.user.id }> acaba de configurar este canal para los registros de verificación de Fandom.`
			} )
		} else {
			void interaction.editReply( 'Has intentado usar un subcomando que no reconozco.' )
		}
	}

	public async copyMessage( message: Message | null, channel: GuildTextBasedChannel, buttonStyle?: MessageButtonStyle | null ): Promise<string> {
		if ( !message ) {
			return `No he podido encontrar el mensaje en <#${ channel.id }>.`
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
			return 'El mensaje ha sido copiado exitosamente.'
		} catch {
			return 'Ha ocurrido un error inesperado, vuelve a intentarlo más tarde.'
		}
	}

	public async setRole( guild: Guild, role: Role | APIRole ): Promise<string> {
		if ( role.managed || role.position === 0 ) {
			return 'Ese rol no es asignable.'
		}

		const highestRole = guild.me?.roles.highest
		if ( highestRole && highestRole.position <= role.position ) {
			return `Solo puedo asignar roles por debajo de mi rol más alto, que es <@&${ highestRole.id }>.`
		}

		const roles = this.container.stores.get( 'models' ).get( 'roles' )

		try {
			await roles.set( {
				guild: guild.id,
				role: role.id,
				type: RoleTypes.Fandom
			} )
			return `Configuración completada. Los usuarios verificados con su cuenta de Fandom recibirán el rol de <@&${ role.id }>`
		} catch {
			return 'Ha ocurrido un error inesperado al intentar registrar el rol. Vuelve a intentarlo en unos minutos.'
		}
	}

	public override async messageRun(): Promise<void> { // eslint-disable-line @typescript-eslint/no-empty-function
	}
}
