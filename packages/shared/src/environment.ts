import dotenv from 'dotenv'
import { MissingEnvError } from './errors'
import path from 'path'
import workspaceRoot from 'find-yarn-workspace-root'

const root = workspaceRoot()
if ( root ) {
	dotenv.config( {
		path: path.resolve( root, '.env' )
	} )
}

const environmentVariables = [
	'DISCORD_OWNER',
	'DISCORD_PREFIX',
	'DISCORD_TOKEN',
	'IMGUR_ID',
	'FANDOM_PASSWORD',
	'FANDOM_USERNAME',
	'NODE_ENV',
	'RABBITMQ_QUEUE',
	'RABBITMQ_QUEUE_OUTPUT',
	'RABBITMQ_URL'
] as const
type Env = typeof environmentVariables[ number ]

export const env = {} as Record<Env, string>
for ( const key of environmentVariables ) {
	const value = process.env[ key ]
	if ( !value ) throw new MissingEnvError( key )
	env[ key ] = value
}
