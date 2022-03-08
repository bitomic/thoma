import type { Args, CommandOptions } from '@sapphire/framework'
import type { CommandInteraction, GuildTextBasedChannel, MessageButtonStyle as MBS, Message } from 'discord.js'
import { copyMessage, getInteractionChannel } from '../../utilities'
import { MessageActionRow, MessageButton } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
import { Command } from '@sapphire/framework'

type MessageButtonStyle = Exclude<MBS, 'LINK'>

@ApplyOptions<CommandOptions>( {
	chatInputApplicationOptions: {
		options: [
			{
				description: 'Identificador del mensaje a copiar',
				name: 'mensaje',
				required: true,
				type: 'STRING'
			},
			{
				choices: [
					{ name: 'Azul', value: 'PRIMARY' },
					{ name: 'Gris', value: 'SECONDARY' },
					{ name: 'Rojo', value: 'DANGER' },
					{ name: 'Verde', value: 'SUCCESS' }
				] as Array<{ name: string, value: MessageButtonStyle }>,
				description: 'Estilo del botón',
				name: 'estilo',
				type: 'STRING'
			}
		]
	},
	description: 'Copia un mensaje para añadirle el botón de verificación.',
	enabled: true,
	name: 'fandom-mensaje'
} )
export class UserCommand extends Command {
	public async execute( message: Message | null, channel: GuildTextBasedChannel, buttonStyle?: MessageButtonStyle | null ): Promise<string> {
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

	public override async chatInputApplicationRun( interaction: CommandInteraction ): Promise<void> {
		if ( !interaction.inGuild() ) return

		await interaction.deferReply( { ephemeral: true } )
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

		const reply = await this.execute( message, channel, buttonStyle )
		void interaction.editReply( reply )
	}

	public override async messageRun( message: Message, args: Args ): Promise<void> {
		if ( message.channel.type === 'DM' ) return

		const messageArg = await args.pick( 'message' )
			.catch( () => null )
		const reply = await this.execute( messageArg, message.channel )
		void message.reply( reply )
	}
}
