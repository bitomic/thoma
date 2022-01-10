import { Colors, Events, getInteractionGuild } from '../../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { GuildChannels } from '../../database'
import type { ITimeoutEventOptions } from '../../listeners/Timeout'
import { SlashCommand } from '../../framework'
import type { SlashCommandOptions } from '../../framework'

@ApplyOptions<SlashCommandOptions>( {
	description: 'Envía a un usuario a aislamiento temporal.',
	enabled: true,
	name: 'timeout',
	options: [
		{
			description: 'Usuario a silenciar',
			name: 'usuario',
			required: true,
			type: 'USER'
		},
		{
			description: 'Duración en horas (5h) o días (3d)',
			name: 'duración',
			required: true,
			type: 'STRING'
		},
		{
			description: 'Motivo del aislamiento',
			name: 'motivo',
			type: 'STRING'
		}
	]
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction<'present'> ): Promise<void> {
		if ( !interaction.memberPermissions.has( 'MODERATE_MEMBERS' ) ) {
			await interaction.reply( {
				content: 'No tienes permisos para aislar temporalmente a otros miembros.',
				ephemeral: true
			} )
			return
		}

		const channelId = ( await GuildChannels.findOne( {
			where: {
				guild: interaction.guildId,
				type: 'warns'
			}
		} ) )?.getDataValue( 'channel' )
		if ( !channelId ) {
			await interaction.reply( {
				content: 'El servidor no tiene configurado un canal de registros de moderación.',
				ephemeral: true
			} )
			return
		}

		const user = interaction.options.getUser( 'usuario', true )
		const duration = interaction.options.getString( 'duración', true )
		const reason = interaction.options.getString( 'motivo' )
		const [
			_, amount, unit
		] = duration.match( /(\d+) *(h|d)/ ) ?? []

		if ( !amount || !unit ) {
			await interaction.reply( {
				embeds: [
					{
						color: Colors.amber[ 10 ],
						description: `No puedo entender la duración que has especificado: **${ duration }**.\nPara aplicar el aislamiento por 3 horas, usa **3h**; para aplicarlo por 5 días, usa **5d**.`
					}
				],
				ephemeral: true
			} )
			return
		}

		const timeMultiplier = unit === 'h'
			? 1000 * 60 * 60
			: 1000 * 60 * 60 * 24
		const time = parseInt( amount, 10 ) * timeMultiplier
		const guild = await getInteractionGuild( interaction )
		const member = await guild.members.fetch( user.id )

		const success = await member.timeout(
			time,
			reason ?? undefined
		)
			.catch( () => {
				void interaction.reply( {
					embeds: [
						{
							color: Colors.red[ 10 ],
							description: 'Ha ocurrido un error al intentar aplicar el aislamiento temporal. Es posible que hayas intentado usar una duración demasiado extensa o intentaste aislar a alguien que no puedo aislar.'
						}
					]
				} )
				return null
			} )

		if ( !success ) return
		const disabledUntil = member.communicationDisabledUntil?.getTime() ?? Date.now() + time
		await interaction.reply( {
			embeds: [
				{
					color: Colors.green[ 10 ],
					description: 'He aplicado el aislamiento temporal correctamente.'
				}
			]
		} )

		const eventOptions: ITimeoutEventOptions = {
			authorId: interaction.user.id,
			endTime: disabledUntil,
			guildId: interaction.guildId,
			reason,
			targetId: user.id
		}
		this.container.client.emit( Events.TIMEOUT, eventOptions )
	}
}
