import type { MessageButtonStyle as MBS } from 'discord.js'

export type MessageButtonStyle = Exclude<MBS, 'LINK'>

export const MessageButtonStyles: Array<{ name: string, value: MessageButtonStyle }> = [
	{ name: 'Azul', value: 'PRIMARY' },
	{ name: 'Gris', value: 'SECONDARY' },
	{ name: 'Rojo', value: 'DANGER' },
	{ name: 'Verde', value: 'SUCCESS' }
]
