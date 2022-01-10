import { Colors, sendWebhook } from '../utilities'
import { ApplyOptions } from '@sapphire/decorators'
import { Events } from '../utilities'
import { GuildChannels } from '../database'
import { isGuildBasedChannel } from '@sapphire/discord.js-utilities'
import { Listener } from '@sapphire/framework'
import type { ListenerOptions } from '@sapphire/framework'

export interface ITimeoutEventOptions {
	authorId: string
	endTime: number
	guildId: string
	targetId: string
	reason: string | null
}

@ApplyOptions<ListenerOptions>( {
	event: Events.TIMEOUT
} )
export class UserEvent extends Listener {
	public async run( options: ITimeoutEventOptions ): Promise<void> {
		const channelId = ( await GuildChannels.findOne( {
			where: {
				guild: options.guildId,
				type: 'warns'
			}
		} ) )?.getDataValue( 'channel' )
		const channel = channelId
			? await ( await this.container.client.guilds.fetch( options.guildId ) ).channels.fetch( channelId )
				.catch( () => null )
			: null

		if ( !channel || !isGuildBasedChannel( channel ) ) {
			await GuildChannels.destroy( {
				where: {
					guild: options.guildId,
					type: 'warns'
				}
			} )
			return
		}

		await sendWebhook( channel, {
			embeds: [
				{
					color: Colors.amber[ 10 ],
					description: `<@!${ options.targetId }> ha sido aislado temporalmente.`,
					fields: [
						{
							name: 'Motivo',
							value: options.reason ?? 'No especificado.'
						},
						{
							inline: true,
							name: 'Autor',
							value: `<@!${ options.authorId }>`
						},
						{
							inline: true,
							name: 'Termina',
							value: `<t:${ Math.floor( options.endTime / 1000 ) }:R>`
						}
					]
				}
			]
		} )
	}
}
