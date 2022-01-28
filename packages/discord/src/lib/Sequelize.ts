import path from 'path'
import { Sequelize } from 'sequelize'
import workspaceRoot from 'find-yarn-workspace-root'

const root = workspaceRoot() ?? path.resolve( __dirname, '../..' )

const filepath = path.resolve( root, 'databases/discord.sqlite' )

export const sequelize = new Sequelize( {
	dialect: 'sqlite',
	logging: false,
	storage: filepath
} )
