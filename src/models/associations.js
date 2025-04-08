// associations.js - Archivo centralizado para definir todas las asociaciones

module.exports = function setupAssociations(db) {
    const { 
        Product, 
        Category, 
        CartItem, 
        OrderItem, 
        User, 
        Cart, 
        Favorite, 
        Order 
    } = db;
    
    // Asociaciones de Category
    Category.hasMany(Category, {
        foreignKey: "parentId",
        as: "subcategories",
    });
    
    // Relación N:M entre Product y Category
    Category.belongsToMany(Product, {
        through: "ProductCategory",
        foreignKey: "categoryId",
    });
    
    Product.belongsToMany(Category, {
        through: "ProductCategory", 
        foreignKey: "productId",
    });
    
    // Asociaciones de Product
    Product.hasMany(CartItem, { foreignKey: "productId" });
    Product.hasMany(OrderItem, { foreignKey: "productId" });
    
    // Asociaciones de User con Product (favoritos)
    Product.belongsToMany(User, {
        through: Favorite || "Favorite",
        foreignKey: "productId",
    });
    
    User.belongsToMany(Product, {
        through: Favorite || "Favorite",
        foreignKey: "userId",
    });
    
    // Asociaciones de User con Order
    User.hasMany(Order, { foreignKey: "userId" });
    Order.belongsTo(User, { foreignKey: "userId" });
    
    // Asociaciones de User con Cart
    User.hasOne(Cart, { foreignKey: "userId" });
    Cart.belongsTo(User, { foreignKey: "userId" });
    
    // Asociaciones de Cart con CartItem
    Cart.hasMany(CartItem, { foreignKey: "cartId" });
    CartItem.belongsTo(Cart, { foreignKey: "cartId" });
    CartItem.belongsTo(Product, { foreignKey: "productId" });
    
    // Asociaciones de Order con OrderItem
    Order.hasMany(OrderItem, { foreignKey: "orderId" });
    OrderItem.belongsTo(Order, { foreignKey: "orderId" });
    OrderItem.belongsTo(Product, { foreignKey: "productId" });

};