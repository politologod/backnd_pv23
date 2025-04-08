const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");

const Favorite = sequelize.define("Favorite", {
	id: {
		type: DataTypes.INTEGER,
		primaryKey: true,
		autoIncrement: true,
	},
});

module.exports = Favorite;