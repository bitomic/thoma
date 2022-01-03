import { Colors, getInteractionMemberRoles } from '../../utilities'
import type { CommandInteraction, MessageEmbedOptions } from 'discord.js'
import { FandomUsers, KeyV } from '../../database'
import { ApplyOptions } from '@sapphire/decorators'
import { Fandom } from 'mw.js'
import { Op } from 'sequelize'
import { SlashCommand } from '../../framework'
import type { SlashCommandOptions } from '../../framework'

@ApplyOptions<SlashCommandOptions>( {
	description: 'Verifícate usando tu cuenta de Fandom.',
	enabled: true,
	guildOnly: true,
	name: 'verificar',
	options: [
		{
			description: 'Nombre de usuario en Fandom.',
			name: 'usuario',
			required: true,
			type: 'STRING'
		},
		{
			description: 'Verificarte automáticamente en otros servidores al unirte.',
			name: 'sincronizar',
			type: 'BOOLEAN'
		}
	]
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction ): Promise<void> {
		if ( !interaction.inGuild() ) {
			await interaction.reply( {
				content: 'Este comando sólo puede ser usado en servidores.',
				ephemeral: true
			} )
			return
		}
		await interaction.deferReply()

		const role = await KeyV.findOne( {
			where: {
				guild: interaction.guildId,
				key: 'fandom-role'
			}
		} )
		if ( !role ) {
			await interaction.deleteReply()
			await interaction.followUp( {
				content: 'Este servidor no tiene configurada la verificación.',
				ephemeral: true
			} )
			return
		}

		const roles = await getInteractionMemberRoles( interaction )
		if ( roles.cache.has( role.value ) ) {
			await interaction.deleteReply()
			await interaction.followUp( {
				content: 'Ya te has verificado.',
				ephemeral: true
			} )
			return
		}

		const username = interaction.options.getString( 'usuario', true )
		const sync = interaction.options.getBoolean( 'sincronizar' )
		const tag = await new Fandom().getUserDiscordTag( username )
			.catch( () => null )

		const embed: MessageEmbedOptions = {
		}
		if ( !tag ) {
			// eslint-disable-next-line prefer-destructuring
			embed.color = Colors.red[ 10 ]
			embed.description = `No hay una cuenta de Discord asociada a la cuenta de Fandom de **${ username }**.
				Asegúrate de haber [enlazado tus cuentas](http://community.fandom.com/wiki/Special:VerifyUser) y vuelve a intentarlo.`
		} else if ( tag !== interaction.user.tag ) {
			// eslint-disable-next-line prefer-destructuring
			embed.color = Colors.amber[ 10 ]
			embed.description = `Los tags de Discord no coinciden. Tu tag actual es **${ interaction.user.tag }**, mientras que el tag en tu cuenta de Fandom es **${ tag }**.
				Puedes [cambiar la cuenta enlazada](http://community.fandom.com/wiki/Special:VerifyUser) e intentarlo de nuevo.`
		} else {
			await FandomUsers.destroy( {
				where: {
					[ Op.or ]: [
						{ snowflake: interaction.user.id },
						{ username }
					]
				}
			} )
			await FandomUsers.create( {
				snowflake: interaction.user.id,
				sync: sync || false,
				username
			} )
			// eslint-disable-next-line prefer-destructuring
			embed.color = Colors.green[ 10 ]
			embed.description = 'Se ha verificado tu cuenta exitosamente.'
		}

		await interaction.editReply( {
			embeds: [ embed ]
		} )

		await roles.add( role.value )
	}
}
