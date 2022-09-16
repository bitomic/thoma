export interface ReminderPayload {
	channel: string | null
	created: number
	dm: boolean
	guild: string | null
	reason: string
	user: string
}
