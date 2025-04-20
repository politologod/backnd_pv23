// associations.js - Archivo centralizado para definir todas las asociaciones

const Product = require('./model_products');
const Category = require('./model_category');
const User = require('./model_user');
const Cart = require('./model_cart');
const CartItem = require('./model_cartItem');
const Order = require('./model_order');
const OrderItem = require('./model_orderItem');
const Favorite = require('./model_favorite');
const OrderStatusHistory = require('./model_orderStatusHistory');
const Tax = require('./model_tax');
const ProductTax = require('./model_productTax');

function setupAssociations() {
    // Relaciones Producto - Categoría
    Product.belongsTo(Category);
    Category.hasMany(Product);
    
    // Relaciones Usuario - Carrito
    Cart.belongsTo(User);
    User.hasOne(Cart);
    
    // Relaciones Carrito - Items
    CartItem.belongsTo(Cart);
    Cart.hasMany(CartItem);
    
    CartItem.belongsTo(Product);
    Product.hasMany(CartItem);
    
    // Relaciones Usuario - Órdenes
    Order.belongsTo(User);
    User.hasMany(Order);
    
    // Relaciones Orden - Items
    OrderItem.belongsTo(Order);
    Order.hasMany(OrderItem);
    
    OrderItem.belongsTo(Product);
    Product.hasMany(OrderItem);
    
    // Relaciones Usuario - Favoritos
    Favorite.belongsTo(User);
    User.hasMany(Favorite);
    
    Favorite.belongsTo(Product);
    Product.hasMany(Favorite);
    
    // Relaciones Orden - Historial de estados
    OrderStatusHistory.belongsTo(Order, { foreignKey: 'orderId' });
    Order.hasMany(OrderStatusHistory, { foreignKey: 'orderId' });
    
    // Relaciones Historial de estados - Usuario (opcional)
    OrderStatusHistory.belongsTo(User, { foreignKey: 'updatedBy', as: 'statusUpdater' });
    
    // Relaciones de Impuestos
    // Relación muchos a muchos entre Productos e Impuestos
    Product.belongsToMany(Tax, { through: ProductTax, foreignKey: 'product_id' });
    Tax.belongsToMany(Product, { through: ProductTax, foreignKey: 'tax_id' });
    
    // Relaciones directas con la tabla intermedia para consultas más fáciles
    ProductTax.belongsTo(Product, { foreignKey: 'product_id' });
    Product.hasMany(ProductTax, { foreignKey: 'product_id' });
    
    ProductTax.belongsTo(Tax, { foreignKey: 'tax_id' });
    Tax.hasMany(ProductTax, { foreignKey: 'tax_id' });
    
    // Relación para saber quién creó/modificó un impuesto
    Tax.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy' });
    Tax.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedBy' });
}

module.exports = setupAssociations;