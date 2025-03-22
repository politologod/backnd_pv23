const { DataTypes } = require("sequelize");
const sequelize = require("../configs/database");
const bcrypt = require("bcrypt");

const User = sequelize.define(
	"User",
	{
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
		googleId: {
			type: DataTypes.STRING,
			allowNull: true,
			unique: true,
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

		profilePic: {
			type: DataTypes.STRING,
			allowNull: true,
		},
	},
	{ timestamps: true }
);

User.beforeCreate(async (user) => {
	if (user.password) {
		const salt = await bcrypt.genSalt(10);
		user.password = await bcrypt.hash(user.password, salt);
	} else {
		user.password = null;
	}
});

User.associate = (models) => {
	// Un usuario tiene muchas órdenes
	User.hasMany(models.Order, { foreignKey: "userId" });

	// Un usuario tiene un carrito
	User.hasOne(models.Cart, { foreignKey: "userId" });

	// Un usuario tiene muchos productos favoritos (N:M)
	User.belongsToMany(models.Product, {
		through: "Favorite",
		foreignKey: "userId",
	});
};

module.exports = User;
