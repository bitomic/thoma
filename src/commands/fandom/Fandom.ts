import type { ApplicationCommandRegistry, CommandOptions } from '@sapphire/framework'
import type { CommandInteraction, Guild, GuildTextBasedChannel, Message, Role } from 'discord.js'
import { copyMessage, getInteractionChannel, getInteractionGuild, MessageButtonStyles, RoleTypes } from '../../utilities'
import { MessageActionRow, MessageButton } from 'discord.js'
import type { APIRole } from 'discord-api-types/v9'
import { ApplyOptions } from '@sapphire/decorators'
import { Command } from '@sapphire/framework'
import type { MessageButtonStyle } from '../../utilities'

@ApplyOptions<CommandOptions>( {
	description: 'Configuración de la verificación usando la cuenta de Fandom.',
	enabled: true,
	name: 'fandom'
} )
export class UserCommand extends Command {
	public override async registerApplicationCommands( registry: ApplicationCommandRegistry ): Promise<void> {
		registry.registerChatInputCommand(
			builder => builder
				.setName( this.name )
				.setDescription( this.description )
				.setDMPermission( false )
				.addSubcommand( input => input
					.setName( 'rol' )
					.setDescription( 'Configura el rol de verificados.' )
					.addRoleOption( option => option
						.setName( 'rol' )
						.setDescription( 'Rol de usuarios verificados.' )
						.setRequired( true ) ) )
				.addSubcommand( input => input
					.setName( 'mensaje' )
					.setDescription( 'Copia un mensaje para colocar el botón de verificaciones.' )
					.addStringOption( option => option
						.setName( 'mensaje' )
						.setDescription( 'Identificador del mensaje.' )
						.setRequired( true ) )
					.addStringOption( option => option
						.setName( 'estilo' )
						.setDescription( 'Estilo del botón' )
						.addChoices( ...MessageButtonStyles ) ) ),
			await this.container.stores.get( 'models' ).get( 'commands' )
				.getData( this.name )
		)
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
