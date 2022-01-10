import { Colors, getInteractionChannel, sendWebhook } from '../../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import { FakeWarns } from '../../database'
import { SlashCommand } from '../../framework'
import type { SlashCommandOptions } from '../../framework'

@ApplyOptions<SlashCommandOptions>( {
	description: 'Da una advertencia falsa',
	enabled: true,
	name: 'fake-warn',
	options: [
		{
			description: 'Usuario a advertir',
			name: 'usuario',
			required: true,
			type: 'USER'
		},
		{
			description: 'Motivo de la advertencia',
			name: 'motivo',
			required: true,
			type: 'STRING'
		}
	]
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction<'present'> ): Promise<void> {
		const lastWarnDate = ( await FakeWarns.findOne( {
			order: [
				[
					'date', 'DESC'
				]
			],
			where: {
				author: interaction.user.id,
				guild: interaction.guildId
			}
		} ) )?.getDataValue( 'date' )

		if ( lastWarnDate && Date.now() - lastWarnDate.getTime() < 1000 * 60 * 60 ) {
			const time = Math.floor( lastWarnDate.getTime() / 1000 )
			await interaction.reply( {
				content: `Solo puedes dar una advertencia por hora. Tu última advertencia fue <t:${ time }:R>.`,
				ephemeral: true
			} )
			return
		}

		const user = interaction.options.getUser( 'usuario', true )
		const reason = interaction.options.getString( 'motivo', true )

		if ( user.id === interaction.user.id ) {
			await interaction.reply( {
				content: 'No puedes advertirte a ti mismo.',
				ephemeral: true
			} )
			return
		}

		await FakeWarns.create( {
			author: interaction.user.id,
			date: new Date(),
			guild: interaction.guildId,
			reason,
			user: user.id
		} )
		await interaction.reply( {
			content: 'Tu advertencia debería de ser anunciada en los próximos segundos.',
			ephemeral: true
		} )

		const channel = await getInteractionChannel( interaction )
		if ( !channel ) return
		await sendWebhook( channel, {
			embeds: [
				{
					author: {
						iconURL: user.avatarURL( { format: 'png' } ) ?? '',
						name: user.tag
					},
					color: Colors.deepOrange[ 10 ],
					description: `<@!${ user.id }> ha recibido una advertencia.`,
					fields: [
						{
							name: 'Motivo',
							value: reason
						}
					],
					footer: {
						iconURL: interaction.user.avatarURL( { format: 'png' } ) ?? '',
						text: `Advertencia hecha por ${ interaction.user.tag }`
					}
				}
			]
		} )
	}
}
