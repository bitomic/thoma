import { ApplyOptions } from '@sapphire/decorators'
import { Colors } from '../utilities'
import { UIDs } from '../database'
import { UserCommand } from '../framework'
import type { UserCommandOptions } from '../framework'
import type { UserContextMenuInteraction } from 'discord.js'

@ApplyOptions<UserCommandOptions>( {
	enabled: true,
	guilds: [ '768261477345525781' ],
	name: 'UID'
} )
export class UserApplicationCommand extends UserCommand {
	public async run( interaction: UserContextMenuInteraction ): Promise<void> {
		const snowflake = interaction.targetId
		const records = ( await UIDs.findAll( {
			where: {
				snowflake
			}
		} ) ).map( i => i.toJSON() )

		if ( records.length === 0 ) {
			void interaction.reply( {
				embeds: [
					{
						color: Colors.amber[ 10 ],
						description: `<@!${ snowflake }> no ha registrado su información.`
					}
				],
				ephemeral: true
			} )
			return
		}

		void interaction.reply( {
			embeds: [
				{
					color: Colors.lightBlue[ 10 ],
					fields: records.map( row => ( {
						name: row.server,
						value: `${ row.username } (${ row.uid })`
					} ) ),
					footer: {
						iconURL: interaction.user.avatarURL( { format: 'png' } ) || '',
						text: `Solicitado por ${ interaction.user.tag }`
					},
					thumbnail: {
						url: interaction.targetUser.avatarURL( { format: 'png' } ) || ''
					},
					title: interaction.targetUser.tag
				}
			]
		} )
	}
}
