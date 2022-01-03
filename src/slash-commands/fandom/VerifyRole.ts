import { ApplyOptions } from '@sapphire/decorators'
import { Colors } from '../../utilities'
import type { CommandInteraction } from 'discord.js'
import { KeyV } from '../../database'
import { MessageEmbed } from 'discord.js'
import { SlashCommand } from '../../framework'
import type { SlashCommandOptions } from '../../framework'

@ApplyOptions<SlashCommandOptions>( {
	description: 'Configura el rol recibido al verificar la cuenta de Fandom.',
	enabled: true,
	guildOnly: true,
	name: 'rol-fandom',
	options: [
		{
			description: 'Rol que se asignará.',
			name: 'rol',
			required: true,
			type: 'ROLE'
		}
	]
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction ): Promise<void> {
		if ( !interaction.inGuild() || !interaction.memberPermissions.has( 'MANAGE_GUILD' ) ) {
			await interaction.reply( {
				content: 'Este comando sólo puede ser usado en servidores por miembros con permiso para gestionar el servidor.',
				ephemeral: true
			} )
			return
		}
		await interaction.deferReply()

		const role = interaction.options.getRole( 'rol', true )
		await KeyV.upsert( {
			guild: interaction.guildId,
			key: 'fandom-role',
			value: role.id
		} )

		const embed = new MessageEmbed( {
			color: Colors.green[ 10 ],
			description: `Los usuarios recibirán el rol de <@&${ role.id }> al verificarse usando \`/verificar\`.`
		} )
		await interaction.editReply( {
			embeds: [ embed ]
		} )
	}
}
