const Sequelize = require("sequelize");
const sequelize = require("../configs/database");

const Product = require("./model_products");
const Category = require("./model_category");
const CartItem = require("./model_cartItem");
const OrderItem = require("./model_orderItem");
const User = require("./model_user");
const Cart = require("./model_cart");
const Favorite = require("./model_favorite");
const Order = require("./model_order");

// Crear objeto de modelos
const db = {
    sequelize,
    Sequelize,
    Product,
    Category,
    CartItem,
    OrderItem,
    User,
    Cart,
    Favorite,
    Order,
};

// Importar función de asociaciones y ejecutarla con todos los modelos
const setupAssociations = require('./associations');
setupAssociations(db);

module.exports = db;