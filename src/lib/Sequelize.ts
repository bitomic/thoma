import { env } from './environment'
import { Sequelize } from 'sequelize'

export const sequelize = new Sequelize( {
	dialect: 'sqlite',
	logging: false,
	storage: env.SQLITE_PATH
} )
