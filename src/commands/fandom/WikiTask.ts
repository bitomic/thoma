import { ApplyOptions } from '@sapphire/decorators'
import { Command } from '@sapphire/framework'
import type { CommandInteraction } from 'discord.js'
import type { CommandOptions } from '@sapphire/framework'
import { env } from '../../lib'

@ApplyOptions<CommandOptions>( {
	chatInputApplicationOptions: {
		defaultPermission: false,
		guildIds: [ '768261477345525781' ],
		options: [ {
			choices: [
				{ name: 'Wiki Genshin Impact - Prefijos', value: 'es.genshin-impact/prefixes' },
				{ name: 'Wiki Genshin Impact - Rarezas', value: 'es.genshin-impact/rarities' },
				{ name: 'Yu-Gi-Oh! Decks Wiki - Cartas', value: 'es.yugiohdecks/cards' }
			],
			description: 'Nombre de la tarea',
			name: 'tarea',
			required: true,
			type: 'STRING'
		} ],
		permissions: [ {
			id: '787145860134993920',
			permission: true,
			type: 'ROLE'
		} ]
	},
	description: 'Ejecuta una tarea programada para un wiki.',
	enabled: true,
	name: 'wiki-task'
} )
export class UserCommand extends Command {
	public override async chatInputApplicationRun( interaction: CommandInteraction ): Promise<void> {
		const [ interwiki, consumer ] = interaction.options.getString( 'tarea', true ).split( '/' ) as [ string, string ]
		if ( interwiki === 'es.yugiohdecks' && interaction.user.id !== env.DISCORD_OWNER ) {
			void interaction.reply( {
				content: `No tienes permiso para usar este comando.\nContacta con <@!${ env.DISCORD_OWNER }>.`,
				ephemeral: true
			} )
			return
		}

		await this.container.octokit.request( 'POST /repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches', {
			inputs: { consumer },
			owner: 'bitomic',
			ref: 'main',
			repo: 'wiki-scripts',
			workflow_id: `${ interwiki }.yml`
		} )
		void interaction.reply( {
			content: 'Se ha programado la tarea, debería de estar completada en un par de minutos.'
		} )
	}

	public override messageRun(): void {
		// eslint-disable-line @typescript-eslint/no-empty-function
	}
}
