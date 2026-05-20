import Sequelize from 'sequelize';
import sequelize from '../configs/database';

import Product from './model_products';
import Category from './model_category';
import CartItem from './model_cartItem';
import OrderItem from './model_orderItem';
import User from './model_user';
import Cart from './model_cart';
import Favorite from './model_favorite';
import Order from './model_order';
import OrderStatusHistory from './model_orderStatusHistory';
import Tax from './model_tax';
import ProductTax from './model_productTax';
import ExchangeRate from './model_exchangeRate';
import ExchangeRateConfig from './model_exchangeRateConfig';
import SiteConfig from './model_siteConfig';
import PaymentMethod from './model_paymentMethod';
import ShippingMethod from './model_shippingMethod';
import DeliveryZone from './model_deliveryZone';

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
    OrderStatusHistory,
    Tax,
    ProductTax,
    ExchangeRate,
    ExchangeRateConfig,
    SiteConfig,
    PaymentMethod,
    ShippingMethod,
    DeliveryZone,
};

// Importar función de asociaciones y ejecutarla con todos los modelos
import setupAssociations from './associations';
setupAssociations(db);

export default db;

// Named exports for direct imports
export {
    sequelize,
    Product,
    Category,
    CartItem,
    OrderItem,
    User,
    Cart,
    Favorite,
    Order,
    OrderStatusHistory,
    Tax,
    ProductTax,
    ExchangeRate,
    ExchangeRateConfig,
    SiteConfig,
    PaymentMethod,
    ShippingMethod,
    DeliveryZone,
};