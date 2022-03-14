import { env } from './environment'
import { Sequelize } from 'sequelize'
console.log( env.SQLITE_PATH )
export const sequelize = new Sequelize( {
	dialect: 'sqlite',
	logging: false,
	storage: env.SQLITE_PATH
} )
