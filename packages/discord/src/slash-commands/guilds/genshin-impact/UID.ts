import type { CommandInteraction, MessageEmbedOptions } from 'discord.js'
import { ApplyOptions } from '@sapphire/decorators'
import { Colors } from '../../../utilities'
import type { IUID } from '../../../database'
import { SlashCommand } from '../../../framework'
import type { SlashCommandOptions } from '../../../framework'
import { UIDs } from '../../../database'

const SERVERS: Array<IUID[ 'server' ]> = [
	'América', 'Asia', 'China', 'Europa'
]

@ApplyOptions<SlashCommandOptions>( {
	description: 'UID de Genshin Impact.',
	enabled: true,
	guilds: [ 'genshinImpact' ],
	name: 'uid',
	options: [
		{
			description: 'Registra (o actualiza) tu UID.',
			name: 'registrar',
			options: [
				{
					description: 'UID del juego',
					maxValue: 999999999,
					minValue: 100000000,
					name: 'uid',
					required: true,
					type: 'INTEGER'
				},
				{
					description: 'Nombre in-game',
					name: 'nombre',
					required: true,
					type: 'STRING'
				},
				{
					choices: SERVERS.map( server => ( {
						name: server,
						value: server
					} ) ),
					description: 'Servidor donde juegas',
					name: 'servidor',
					required: true,
					type: 'STRING'
				}
			],
			type: 'SUB_COMMAND'
		}
	]
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction<'present'> ): Promise<void> {
		if ( !interaction.inGuild() ) return
		await interaction.deferReply()

		const uid = `${ interaction.options.getInteger( 'uid', true ) }`
		const username = interaction.options.getString( 'nombre', true )
		const server = interaction.options.getString( 'servidor', true ) as unknown as IUID[ 'server' ]

		const uidExists = await UIDs.findOne( {
			where: {
				uid
			}
		} )
		if ( uidExists ) {
			await interaction.editReply( {
				embeds: [
					{
						color: Colors.amber[ 10 ],
						description: `El UID **${ uid }** ya se encuentra registrado.`
					}
				]
			} )
			return
		}

		const userExists = await UIDs.findOne( {
			where: {
				server,
				username
			}
		} )
		await UIDs.upsert( {
			server,
			snowflake: interaction.user.id,
			uid,
			username
		} )

		const embed: MessageEmbedOptions = {
			color: Colors.green[ 10 ],
			description: 'Se ha registrado tu UID exitosamente.'
		}
		if ( userExists ) {
			embed.description += `\nYa tenías un UID registrado para el servidor de ${ server }, y ha sido eliminado. Solo puedo registrar un UID por servidor.`
		}
		void interaction.editReply( {
			embeds: [ embed ]
		} )
	}
}
