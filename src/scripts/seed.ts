/**
 * Seed Data Script — Template SaaS Multi-Vertical
 * 
 * Uso:
 *   npx ts-node src/scripts/seed.ts --vertical=tech
 *   npx ts-node src/scripts/seed.ts --vertical=food
 *   npx ts-node src/scripts/seed.ts --vertical=water
 *   npx ts-node src/scripts/seed.ts --vertical=clothing
 *   npx ts-node src/scripts/seed.ts                     (default: tech)
 * 
 * Flags:
 *   --force    Borra datos existentes antes de sembrar
 */

import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../configs/database';
import User from '../models/model_user';
import Category from '../models/model_category';
import Product from '../models/model_products';
import PaymentMethod from '../models/model_paymentMethod';
import ShippingMethod from '../models/model_shippingMethod';
import DeliveryZone from '../models/model_deliveryZone';
import SiteConfig from '../models/model_siteConfig';
import bcrypt from 'bcrypt';

// Importar asociaciones
import '../models';

// ============================================================
// Datos por vertical
// ============================================================

const VERTICALS = {
  tech: {
    storeName: 'TechStore',
    storeDescription: 'Tu tienda de tecnología de confianza',
    categories: [
      { name: 'Laptops', slug: 'laptops', description: 'Computadoras portátiles' },
      { name: 'Smartphones', slug: 'smartphones', description: 'Teléfonos inteligentes' },
      { name: 'Accesorios', slug: 'accesorios', description: 'Cables, cargadores, fundas' },
      { name: 'Audio', slug: 'audio', description: 'Audífonos, parlantes, micrófonos' },
      { name: 'Gaming', slug: 'gaming', description: 'Consolas, periféricos, sillas gamer' },
    ],
    products: [
      { name: 'Laptop HP Pavilion 15', price: 699.99, stock: 15, description: 'Laptop para trabajo y estudio', category: 'laptops', sku: 'TECH-LAP-001' },
      { name: 'MacBook Air M2', price: 1199.99, stock: 8, description: 'Laptop Apple con chip M2', category: 'laptops', sku: 'TECH-LAP-002' },
      { name: 'iPhone 15 Pro', price: 999.99, stock: 20, description: 'Smartphone Apple', category: 'smartphones', sku: 'TECH-PHN-001' },
      { name: 'Samsung Galaxy S24', price: 849.99, stock: 25, description: 'Smartphone Android premium', category: 'smartphones', sku: 'TECH-PHN-002' },
      { name: 'Cargador USB-C 65W', price: 29.99, stock: 100, description: 'Cargador rápido universal', category: 'accesorios', sku: 'TECH-ACC-001' },
      { name: 'AirPods Pro', price: 249.99, stock: 30, description: 'Audífonos inalámbricos Apple', category: 'audio', sku: 'TECH-AUD-001' },
      { name: 'PlayStation 5', price: 499.99, stock: 10, description: 'Consola de videojuegos Sony', category: 'gaming', sku: 'TECH-GAM-001' },
    ],
  },

  food: {
    storeName: 'FoodExpress',
    storeDescription: 'Comida deliciosa a tu puerta',
    categories: [
      { name: 'Platos Principales', slug: 'platos-principales', description: 'Entradas y platos fuertes' },
      { name: 'Postres', slug: 'postres', description: 'Dulces y postres artesanales' },
      { name: 'Bebidas', slug: 'bebidas', description: 'Jugos, batidos y refrescos' },
      { name: 'Combos', slug: 'combos', description: 'Ofertas especiales combinadas' },
    ],
    products: [
      { name: 'Hamburguesa Clásica', price: 8.99, stock: 50, description: 'Carne 200g con queso', category: 'platos-principales', sku: 'FOOD-PLT-001' },
      { name: 'Pizza Margherita', price: 12.99, stock: 30, description: 'Tomate, mozzarella, albahaca', category: 'platos-principales', sku: 'FOOD-PLT-002' },
      { name: 'Brownie de Chocolate', price: 4.99, stock: 40, description: 'Brownie artesanal', category: 'postres', sku: 'FOOD-PST-001' },
      { name: 'Limonada Natural', price: 3.50, stock: 100, description: 'Limonada fresca 500ml', category: 'bebidas', sku: 'FOOD-BEB-001' },
      { name: 'Combo Familiar', price: 24.99, stock: 20, description: '2 hamburguesas + 2 bebidas + postre', category: 'combos', sku: 'FOOD-CMB-001' },
    ],
  },

  water: {
    storeName: 'AguaPura',
    storeDescription: 'Agua purificada y servicios de recarga',
    categories: [
      { name: 'Botellones', slug: 'botellones', description: 'Botellones de agua purificada' },
      { name: 'Packs', slug: 'packs', description: 'Packs de botellas individuales' },
      { name: 'Dispensadores', slug: 'dispensadores', description: 'Dispensadores y accesorios' },
      { name: 'Servicios', slug: 'servicios', description: 'Recargas y mantenimiento' },
    ],
    products: [
      { name: 'Botellón 20L', price: 3.50, stock: 200, description: 'Botellón de agua purificada 20 litros', category: 'botellones', sku: 'WAT-BOT-001' },
      { name: 'Pack 12 Botellas 500ml', price: 5.99, stock: 100, description: 'Pack de 12 botellas individuales', category: 'packs', sku: 'WAT-PCK-001' },
      { name: 'Dispensador Eléctrico', price: 45.00, stock: 15, description: 'Dispensador eléctrico de agua fría/caliente', category: 'dispensadores', sku: 'WAT-DIS-001' },
      { name: 'Recarga Botellón', price: 2.00, stock: 999, description: 'Servicio de recarga de botellón existente', category: 'servicios', sku: 'WAT-SRV-001' },
    ],
  },

  clothing: {
    storeName: 'ModaStyle',
    storeDescription: 'Moda y estilo para todos',
    categories: [
      { name: 'Camisas', slug: 'camisas', description: 'Camisas casuales y formales' },
      { name: 'Pantalones', slug: 'pantalones', description: 'Jeans, chinos y pantalones' },
      { name: 'Zapatos', slug: 'zapatos', description: 'Calzado para toda ocasión' },
      { name: 'Accesorios', slug: 'accesorios-moda', description: 'Relojes, cinturones, carteras' },
    ],
    products: [
      { name: 'Camisa Oxford Azul', price: 35.00, stock: 40, description: 'Camisa Oxford algodón 100%', category: 'camisas', sku: 'CLO-CAM-001' },
      { name: 'Jean Slim Fit', price: 49.99, stock: 30, description: 'Jean slim fit denim premium', category: 'pantalones', sku: 'CLO-PAN-001' },
      { name: 'Sneakers Blancos', price: 65.00, stock: 25, description: 'Zapatos deportivos casual', category: 'zapatos', sku: 'CLO-ZAP-001' },
      { name: 'Cinturón Cuero', price: 22.00, stock: 50, description: 'Cinturón cuero genuino', category: 'accesorios-moda', sku: 'CLO-ACC-001' },
    ],
  },
};

// Métodos de pago comunes (Venezuela)
const DEFAULT_PAYMENT_METHODS = [
  { slug: 'transferencia_ves', label: 'Transferencia Bancaria (VES)', sortOrder: 1 },
  { slug: 'pago_movil', label: 'Pago Móvil', sortOrder: 2 },
  { slug: 'efectivo_usd', label: 'Efectivo USD', sortOrder: 3 },
  { slug: 'efectivo_eur', label: 'Efectivo EUR', sortOrder: 4 },
  { slug: 'efectivo_bolivares', label: 'Efectivo Bolívares', sortOrder: 5 },
  { slug: 'punto_venta', label: 'Punto de Venta', sortOrder: 6 },
  { slug: 'usdt', label: 'USDT (Tether)', sortOrder: 7 },
  { slug: 'tarjeta', label: 'Tarjeta Débito/Crédito', sortOrder: 8 },
  { slug: 'transferencia_internacional', label: 'Transferencia Internacional', sortOrder: 9 },
];

// Métodos de envío comunes
const DEFAULT_SHIPPING_METHODS = [
  { slug: 'delivery_moto', label: 'Delivery con Moto', sortOrder: 1, config: { description: 'Entrega a domicilio con motodelivery local' } },
  { slug: 'pickup_tienda', label: 'Retiro en Tienda', sortOrder: 2, config: { description: 'El cliente retira su pedido en nuestra tienda física' } },
  { slug: 'encomienda_nacional', label: 'Encomienda Nacional', sortOrder: 3, config: { description: 'Envío a cualquier parte del país mediante empresa de transporte' } },
];

// Zonas de delivery por defecto
const DEFAULT_DELIVERY_ZONES = [
  { name: 'Zona Centro', shippingFee: 2.00, estimatedTime: '30-45 min' },
  { name: 'Zona Norte', shippingFee: 3.50, estimatedTime: '45-60 min' },
  { name: 'Zona Sur', shippingFee: 3.50, estimatedTime: '45-60 min' },
  { name: 'Zona Este', shippingFee: 4.00, estimatedTime: '60-90 min' },
  { name: 'Zona Oeste', shippingFee: 4.00, estimatedTime: '60-90 min' },
];

// ============================================================
// Script principal
// ============================================================

async function seed() {
  const args = process.argv.slice(2);
  const verticalArg = args.find(a => a.startsWith('--vertical='));
  const verticalKey = (verticalArg ? verticalArg.split('=')[1] : 'tech') as keyof typeof VERTICALS;
  const force = args.includes('--force');

  if (!VERTICALS[verticalKey]) {
    console.error(`❌ Vertical "${verticalKey}" no reconocida. Opciones: ${Object.keys(VERTICALS).join(', ')}`);
    process.exit(1);
  }

  const vertical = VERTICALS[verticalKey];
  console.log(`\n🌱 Sembrando datos para vertical: ${verticalKey.toUpperCase()}\n`);

  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a BD establecida');

    if (force) {
      console.log('⚠️  Modo FORCE: sincronizando modelos con force...');
      await sequelize.sync({ force: true });
    } else {
      await sequelize.sync({ alter: false });
    }
    console.log('✅ Modelos sincronizados');

    // 1. Crear usuario admin
    console.log('\n👤 Creando usuario admin...');
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin123!';
    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: 'admin@admin.com' },
      defaults: {
        name: 'Administrador',
        email: 'admin@admin.com',
        password: adminPassword,
        role: 'admin',
      },
    });
    console.log(adminCreated ? '  ✅ Admin creado (admin@admin.com)' : '  ⏭️  Admin ya existe');

    // 2. Crear categorías
    console.log('\n📂 Creando categorías...');
    const categoryMap: Record<string, any> = {};
    for (const cat of vertical.categories) {
      const [category, created] = await Category.findOrCreate({
        where: { slug: cat.slug },
        defaults: { name: cat.name, slug: cat.slug, description: cat.description, active: true, sortOrder: 0 },
      });
      categoryMap[cat.slug] = category;
      console.log(`  ${created ? '✅' : '⏭️'} ${cat.name}`);
    }

    // 3. Crear productos
    console.log('\n📦 Creando productos...');
    for (const prod of vertical.products) {
      const [product, created] = await Product.findOrCreate({
        where: { sku: prod.sku },
        defaults: {
          name: prod.name,
          price: prod.price,
          stock: prod.stock,
          description: prod.description,
          sku: prod.sku,
          currency: 'USD',
          status: 'active',
        },
      });

      if (created && categoryMap[prod.category]) {
        await (product as any).setCategories([categoryMap[prod.category]]);
      }
      console.log(`  ${created ? '✅' : '⏭️'} ${prod.name} ($${prod.price})`);
    }

    // 4. Crear métodos de pago
    console.log('\n💳 Creando métodos de pago...');
    for (const pm of DEFAULT_PAYMENT_METHODS) {
      const [, created] = await PaymentMethod.findOrCreate({
        where: { slug: pm.slug },
        defaults: { slug: pm.slug, label: pm.label, enabled: true, sortOrder: pm.sortOrder },
      });
      console.log(`  ${created ? '✅' : '⏭️'} ${pm.label}`);
    }

    // 5. Crear métodos de envío
    console.log('\n🚚 Creando métodos de envío...');
    for (const sm of DEFAULT_SHIPPING_METHODS) {
      const [, created] = await ShippingMethod.findOrCreate({
        where: { slug: sm.slug },
        defaults: { slug: sm.slug, label: sm.label, enabled: true, sortOrder: sm.sortOrder, config: sm.config },
      });
      console.log(`  ${created ? '✅' : '⏭️'} ${sm.label}`);
    }

    // 6. Crear zonas de delivery
    console.log('\n📍 Creando zonas de delivery...');
    for (const dz of DEFAULT_DELIVERY_ZONES) {
      const [, created] = await DeliveryZone.findOrCreate({
        where: { name: dz.name },
        defaults: { name: dz.name, shippingFee: dz.shippingFee, estimatedTime: dz.estimatedTime, enabled: true },
      });
      console.log(`  ${created ? '✅' : '⏭️'} ${dz.name} ($${dz.shippingFee})`);
    }

    // 7. Configuración de tienda
    console.log('\n⚙️  Configurando tienda...');
    const [siteConfig, configCreated] = await SiteConfig.findOrCreate({
      where: { name: 'main' },
      defaults: {
        name: 'main',
        description: vertical.storeDescription,
        primaryColor: '#6366f1',
        maintenance_mode: false,
        active: true,
      },
    });
    console.log(configCreated ? '  ✅ Configuración creada' : '  ⏭️  Configuración ya existe');

    // Resumen
    console.log('\n' + '='.repeat(50));
    console.log(`🎉 Seed completado para vertical: ${verticalKey.toUpperCase()}`);
    console.log(`   Tienda: ${vertical.storeName}`);
    console.log(`   Categorías: ${vertical.categories.length}`);
    console.log(`   Productos: ${vertical.products.length}`);
    console.log(`   Métodos de pago: ${DEFAULT_PAYMENT_METHODS.length}`);
    console.log(`   Métodos de envío: ${DEFAULT_SHIPPING_METHODS.length}`);
    console.log(`   Zonas de delivery: ${DEFAULT_DELIVERY_ZONES.length}`);
    console.log(`   Admin: admin@admin.com`);
    console.log('='.repeat(50) + '\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
}

seed();
