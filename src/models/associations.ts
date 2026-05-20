// associations.js - Archivo centralizado para definir todas las asociaciones

import Product from './model_products';
import Category from './model_category';
import User from './model_user';
import Cart from './model_cart';
import CartItem from './model_cartItem';
import Order from './model_order';
import OrderItem from './model_orderItem';
import Favorite from './model_favorite';
import OrderStatusHistory from './model_orderStatusHistory';
import Tax from './model_tax';
import ProductTax from './model_productTax';

function setupAssociations(db: any) {
    // Relaciones Producto - Categoría (Many-to-Many)
    // Primero eliminamos la relación incorrecta
    if (Product.associations && Product.associations.Category) {
        delete Product.associations.Category;
    }
    if (Category.associations && Category.associations.Products) {
        delete Category.associations.Products;
    }
    
    // Creamos la relación many-to-many correcta
    Product.belongsToMany(Category, { through: 'ProductCategories' });
    Category.belongsToMany(Product, { through: 'ProductCategories' });
    
    // Relación Categoría - Self-referencing (jerarquía)
    Category.hasMany(Category, { as: 'children', foreignKey: 'parentId' });
    Category.belongsTo(Category, { as: 'parent', foreignKey: 'parentId' });
    
    // Relaciones Usuario - Carrito
    Cart.belongsTo(User, { targetKey: 'id_autoincrement', foreignKey: 'UserIdAutoincrement' });
    User.hasOne(Cart, { foreignKey: 'UserIdAutoincrement' });
    
    // Relaciones Carrito - Items
    CartItem.belongsTo(Cart);
    Cart.hasMany(CartItem);
    
    CartItem.belongsTo(Product);
    Product.hasMany(CartItem);
    
    // Relaciones Usuario - Órdenes
    Order.belongsTo(User, { targetKey: 'id_autoincrement', foreignKey: 'UserIdAutoincrement' });
    User.hasMany(Order, { foreignKey: 'UserIdAutoincrement' });
    
    // Relaciones Orden - Items
    OrderItem.belongsTo(Order);
    Order.hasMany(OrderItem);
    
    OrderItem.belongsTo(Product);
    Product.hasMany(OrderItem);
    
    // Relaciones Usuario - Favoritos
    Favorite.belongsTo(User, { targetKey: 'id_autoincrement', foreignKey: 'UserIdAutoincrement' });
    User.hasMany(Favorite, { foreignKey: 'UserIdAutoincrement' });
    
    Favorite.belongsTo(Product);
    Product.hasMany(Favorite);
    
    // Relaciones Orden - Historial de estados
    OrderStatusHistory.belongsTo(Order, { foreignKey: 'orderId' });
    Order.hasMany(OrderStatusHistory, { foreignKey: 'orderId' });
    
    // Relaciones Historial de estados - Usuario (opcional)
    OrderStatusHistory.belongsTo(User, { foreignKey: 'updatedBy', as: 'statusUpdater', targetKey: 'id_autoincrement' });
    
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
    Tax.belongsTo(User, { foreignKey: 'created_by', as: 'createdBy', targetKey: 'id_autoincrement' });
    Tax.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedBy', targetKey: 'id_autoincrement' });
}

export default setupAssociations;