import {  DataTypes  } from 'sequelize';
import sequelize from '../configs/database';

const Favorite = sequelize.define("Favorite", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
});

export default Favorite;