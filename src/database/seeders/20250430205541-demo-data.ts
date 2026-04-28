'use strict';
import bcrypt from 'bcrypt';

/** @type {import('sequelize-cli').Migration} */
export default {
  async up(queryInterface, Sequelize) {
    // Crear usuarios de prueba
    const users = await queryInterface.bulkInsert('Users', [
      {
        name: 'Admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('Admin123!', 10),
        role: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Vendedor',
        email: 'vendedor@example.com',
        password: await bcrypt.hash('Vendedor123!', 10),
        role: 'vendor',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Cliente',
        email: 'cliente@example.com',
        password: await bcrypt.hash('Cliente123!', 10),
        role: 'customer',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // Crear categorías de prueba
    const categories = await queryInterface.bulkInsert('Categories', [
      {
        name: 'Ropa',
        description: 'Ropa para toda la familia',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Accesorios',
        description: 'Accesorios y complementos',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], { returning: true });

    // Crear productos de prueba
    await queryInterface.bulkInsert('Products', [
      {
        name: 'Camiseta Básica',
        sku: 'CAM-001',
        description: 'Camiseta 100% algodón',
        price: 19.99,
        stock: 100,
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Pantalón Vaquero',
        sku: 'PAN-001',
        description: 'Pantalón vaquero clásico',
        price: 39.99,
        stock: 50,
        categoryId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Collar Artesanal',
        sku: 'ACC-001',
        description: 'Collar hecho a mano',
        price: 29.99,
        stock: 30,
        categoryId: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Crear carritos de prueba
    await queryInterface.bulkInsert('Carts', [
      {
        UserIdAutoincrement: 3, // Cliente
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Crear items de carrito de prueba
    await queryInterface.bulkInsert('CartItems', [
      {
        CartId: 1,
        ProductId: 1,
        quantity: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        CartId: 1,
        ProductId: 3,
        quantity: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    // Eliminar datos en orden inverso
    await queryInterface.bulkDelete('CartItems', null, {});
    await queryInterface.bulkDelete('Carts', null, {});
    await queryInterface.bulkDelete('Products', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
