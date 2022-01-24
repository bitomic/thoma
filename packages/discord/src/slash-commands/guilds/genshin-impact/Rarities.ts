import { Colors, Events, getInteractionChannel, Guilds } from '../../../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import type { CommandInteraction } from 'discord.js'
import type { IAMQPMessageData } from '../../../utilities'
import { Message } from 'discord.js'
import { SlashCommand } from '../../../framework'
import type { SlashCommandOptions } from '../../../framework'
import { SlashPermissions } from '../../../decorators'

@SlashPermissions( {
	ids: [ Guilds.genshinImpact.roles.contentCreator ],
	permission: true,
	type: 'ROLE'
} )
@ApplyOptions<SlashCommandOptions>( {
	defaultPermission: true,
	description: 'Actualiza la rareza de los objetos.',
	enabled: true,
	guilds: [ 'genshinImpact' ],
	name: 'rarezas'
} )
export class UserSlash extends SlashCommand {
	public async run( interaction: CommandInteraction<'present'> ): Promise<void> {
		await interaction.reply( {
			embeds: [
				{
					color: Colors.lime[ 10 ],
					description: 'Se ha registrado una tarea.'
				}
			]
		} )


		let message = await interaction.fetchReply()
		if ( !( message instanceof Message ) ) {
			const channel = await getInteractionChannel( interaction )
			if ( !channel ) return
			message = await channel.messages.fetch( message.id )
		}

		const thread = await message.startThread( {
			name: `Rarezas @ ${ Date.now().toString( 16 ) }`
		} )


		const data: IAMQPMessageData = {
			channelId: interaction.channelId,
			guildId: interaction.guildId,
			task: 'rarities',
			threadId: thread.id
		}
		this.container.client.emit( Events.AMQP_SEND, data )
	}
}
