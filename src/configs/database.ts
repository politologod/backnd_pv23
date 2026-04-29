import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';

// Cargar el archivo .env adecuado según el entorno
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const sequelize = new Sequelize(process.env.DATABASE_URL as string, {
	dialect: "postgres",
	logging: false,
	dialectOptions: process.env.DB_SSL === 'true' ? {
		ssl: {
			require: true,
			rejectUnauthorized: false
		}
	} : {}
});

export default sequelize;
