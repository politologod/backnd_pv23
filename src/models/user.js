const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database"); 
const bcrypt = require("bcrypt");

const User = sequelize.define("User", {


    id_autoincrement: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        unique: true,
        primaryKey: true,
    },

	name: {
		type: DataTypes.STRING,
		allowNull: false,
	},

	email: {
		type: DataTypes.STRING,
		allowNull: true,
		unique: true, 
		validate: {
			isEmail: true,
		},
	},

	password: {
		type: DataTypes.STRING,
		allowNull: true, 
	},

	address: {
		type: DataTypes.STRING,
		allowNull: true,
	},

	phone: {
		type: DataTypes.STRING,
		allowNull: true,
	},

}, { timestamps: true }); 


User.beforeCreate(async (user) => {
	if (user.password) {
		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(user.password, salt);
	} else {
		user.password = null; 
	}
});

module.exports = User;
