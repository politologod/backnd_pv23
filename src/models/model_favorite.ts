import { IFavorite } from '../types/models';
import {  DataTypes  } from 'sequelize';
import sequelize from '../configs/database';

const Favorite = sequelize.define<IFavorite>("Favorite", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
});

export default Favorite;