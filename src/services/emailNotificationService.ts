import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import {  logger  } from '../configs/logger';
import User from '../models/model_user';

/**
 * Servicio para manejar notificaciones por correo electrónico
 */
class EmailNotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  /**
   * Compila una plantilla Handlebars con datos
   * @param {string} templateName - Nombre del archivo de plantilla
   * @param {Object} data - Datos para la plantilla
   * @returns {string} - HTML compilado
   */
  async compileTemplate(templateName, data) {
    try {
      const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);
      return template(data);
    } catch (error) {
      console.error(`Error al compilar plantilla ${templateName}:`, error);
      throw new Error('Error al compilar plantilla de correo electrónico');
    }
  }

  /**
   * Envía un correo electrónico
   * @param {Object} options - Opciones del correo
   * @returns {boolean} - Éxito del envío
   */
  async sendEmail(options) {
    try {
      const { to, subject, html, text } = options;
      
      const mailOptions = {
        from: process.env.EMAIL_FROM || '"Pura Vida Store" <noreply@puravidastore.com>',
        to,
        subject,
        html,
        text
      };
      
      await this.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error al enviar correo electrónico:', error);
      return false;
    }
  }

  /**
   * Envía correo de bienvenida a un nuevo usuario
   * @param {Object|string} userOrId - Usuario registrado o su ID
   * @returns {boolean} - Éxito del envío
   */
  async sendWelcomeEmail(userOrId) {
    try {
      let user;
      
      // Comprobar si se recibió un ID o un objeto usuario
      if (typeof userOrId === 'string' || typeof userOrId === 'number') {
        // Es un ID, buscar el usuario en la base de datos
        user = await User.findByPk(userOrId);
        if (!user) {
          console.error('Usuario no encontrado para enviar correo de bienvenida', { userId: userOrId });
          return false;
        }
      } else {
        // Es un objeto usuario
        user = userOrId;
      }
      
      // Verificar que el usuario tenga email
      if (!user.email) {
        console.error('No se puede enviar correo de bienvenida: usuario sin email', { userId: user.id });
        return false;
      }
      
      const currentYear = new Date().getFullYear();
      
      const html = await this.compileTemplate('welcome', {
        name: user.name || 'Estimado cliente',
        siteUrl: process.env.FRONTEND_URL || 'https://puravidastore.com',
        email: user.email,
        currentYear
      });
      
      return await this.sendEmail({
        to: user.email,
        subject: '¡Bienvenido a Pura Vida Store!',
        html,
        text: `¡Hola ${user.name || 'Estimado cliente'}! Gracias por registrarte en Pura Vida Store.`
      });
    } catch (error) {
      console.error('Error al enviar correo de bienvenida:', error);
      return false;
    }
  }

  /**
   * Envía correo para restablecer contraseña
   * @param {Object|string} userOrId - Usuario que solicita el restablecimiento o su ID
   * @param {string} token - Token de restablecimiento
   * @returns {boolean} - Éxito del envío
   */
  async sendPasswordResetEmail(userOrId, token) {
    try {
      let user;
      
      // Comprobar si se recibió un ID o un objeto usuario
      if (typeof userOrId === 'string' || typeof userOrId === 'number') {
        // Es un ID, buscar el usuario en la base de datos
        user = await User.findByPk(userOrId);
        if (!user) {
          console.error('Usuario no encontrado para enviar correo de restablecimiento', { userId: userOrId });
          return false;
        }
      } else {
        // Es un objeto usuario
        user = userOrId;
      }
      
      const resetUrl = `${process.env.FRONTEND_URL || 'https://puravidastore.com'}/reset-password?token=${token}`;
      const currentYear = new Date().getFullYear();
      
      const html = await this.compileTemplate('password-reset', {
        name: user.name || 'Estimado cliente',
        resetUrl,
        expiryTime: '1 hora',
        currentYear
      });
      
      return await this.sendEmail({
        to: user.email,
        subject: 'Restablecimiento de contraseña - Pura Vida Store',
        html,
        text: `Hola ${user.name || 'Estimado cliente'}, para restablecer tu contraseña, visita el siguiente enlace: ${resetUrl}. Este enlace expirará en 1 hora.`
      });
    } catch (error) {
      console.error('Error al enviar correo de restablecimiento:', error);
      return false;
    }
  }

  /**
   * Envía confirmación de cambio de contraseña
   * @param {Object|string} userOrId - Usuario que cambió su contraseña o su ID
   * @returns {boolean} - Éxito del envío
   */
  async sendPasswordChangedConfirmationEmail(userOrId) {
    try {
      let user;
      
      // Comprobar si se recibió un ID o un objeto usuario
      if (typeof userOrId === 'string' || typeof userOrId === 'number') {
        // Es un ID, buscar el usuario en la base de datos
        user = await User.findByPk(userOrId);
        if (!user) {
          console.error('Usuario no encontrado para enviar confirmación de cambio de contraseña', { userId: userOrId });
          return false;
        }
      } else {
        // Es un objeto usuario
        user = userOrId;
      }
      
      const currentYear = new Date().getFullYear();
      
      const html = await this.compileTemplate('password-changed', {
        name: user.name || 'Estimado cliente',
        supportEmail: process.env.SUPPORT_EMAIL || 'soporte@puravidastore.com',
        currentYear
      });
      
      return await this.sendEmail({
        to: user.email,
        subject: 'Confirmación: Tu contraseña ha sido actualizada - Pura Vida Store',
        html,
        text: `Hola ${user.name || 'Estimado cliente'}, te confirmamos que tu contraseña ha sido actualizada correctamente. Si no realizaste este cambio, contacta inmediatamente a nuestro equipo de soporte.`
      });
    } catch (error) {
      console.error('Error al enviar confirmación de cambio de contraseña:', error);
      return false;
    }
  }

  /**
   * Envía notificación de nueva orden a administradores
   * @param {Object} order - Datos de la orden
   * @returns {boolean} - Éxito del envío
   */
  async sendNewOrderNotificationToAdmin(order) {
    try {
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
      if (adminEmails.length === 0) return false;
      
      const currentYear = new Date().getFullYear();
      
      const html = await this.compileTemplate('admin-new-order', {
        orderId: order.id,
        customerName: order.customer?.name || 'Cliente',
        orderDate: new Date(order.createdAt).toLocaleString('es-ES'),
        totalAmount: order.total.toFixed(2),
        itemCount: order.items?.length || 0,
        adminDashboardUrl: `${process.env.ADMIN_URL || 'https://admin.puravidastore.com'}/orders/${order.id}`,
        currentYear
      });
      
      return await this.sendEmail({
        to: adminEmails.join(','),
        subject: `Nueva orden #${order.id} - Pura Vida Store`,
        html,
        text: `Se ha recibido una nueva orden #${order.id} de ${order.customer?.name || 'Cliente'} por $${order.total.toFixed(2)}.`
      });
    } catch (error) {
      console.error('Error al enviar notificación de nueva orden:', error);
      return false;
    }
  }

  /**
   * Envía confirmación de orden al cliente
   * @param {Object} order - Datos de la orden
   * @param {Object} customer - Datos del cliente
   * @returns {boolean} - Éxito del envío
   */
  async sendOrderConfirmationToCustomer(order, customer) {
    try {
      const items = order.items?.map(item => ({
        name: item.product?.name || 'Producto',
        quantity: item.quantity,
        price: item.price.toFixed(2),
        subtotal: (item.price * item.quantity).toFixed(2)
      })) || [];
      
      const currentYear = new Date().getFullYear();
      
      const html = await this.compileTemplate('order-confirmation', {
        customerName: customer.name || 'Estimado cliente',
        orderId: order.id,
        orderDate: new Date(order.createdAt).toLocaleString('es-ES'),
        items,
        subtotal: order.subtotal.toFixed(2),
        shipping: order.shipping.toFixed(2),
        tax: order.tax.toFixed(2),
        total: order.total.toFixed(2),
        orderUrl: `${process.env.FRONTEND_URL || 'https://puravidastore.com'}/my-account/orders/${order.id}`,
        shippingAddress: order.shippingAddress,
        paymentMethod: order.paymentMethod,
        currentYear
      });
      
      return await this.sendEmail({
        to: customer.email,
        subject: `Confirmación de orden #${order.id} - Pura Vida Store`,
        html,
        text: `Gracias por tu compra. Tu orden #${order.id} ha sido recibida y está siendo procesada.`
      });
    } catch (error) {
      console.error('Error al enviar confirmación de orden:', error);
      return false;
    }
  }

  /**
   * Envía notificación de nuevos productos
   * @param {Array} products - Lista de nuevos productos
   * @param {Array} subscribers - Lista de suscriptores
   * @returns {boolean} - Éxito del envío
   */
  async sendNewProductsNotification(products, subscribers) {
    try {
      if (!subscribers || subscribers.length === 0) return false;
      
      const formattedProducts = products.map(product => ({
        name: product.name,
        price: product.price.toFixed(2),
        imageUrl: product.mainImage,
        productUrl: `${process.env.FRONTEND_URL || 'https://puravidastore.com'}/products/${product.slug}`
      }));
      
      const currentYear = new Date().getFullYear();
      
      const html = await this.compileTemplate('new-products', {
        products: formattedProducts,
        unsubscribeUrl: `${process.env.FRONTEND_URL || 'https://puravidastore.com'}/unsubscribe`,
        siteUrl: process.env.FRONTEND_URL || 'https://puravidastore.com',
        currentYear
      });
      
      // Enviar a todos los suscriptores usando copia oculta (BCC)
      return await this.sendEmail({
        to: process.env.EMAIL_FROM || 'noreply@puravidastore.com',
        bcc: subscribers.map(sub => sub.email).join(','),
        subject: '¡Nuevos productos disponibles! - Pura Vida Store',
        html,
        text: `Hemos agregado nuevos productos a nuestra tienda. Visita nuestra web para conocerlos.`
      });
    } catch (error) {
      console.error('Error al enviar notificación de nuevos productos:', error);
      return false;
    }
  }

  /**
   * Envía notificación de productos en oferta
   * @param {Array} products - Lista de productos en oferta
   * @param {Array} subscribers - Lista de suscriptores
   * @returns {boolean} - Éxito del envío
   */
  async sendPromotionsNotification(products, subscribers) {
    try {
      if (!subscribers || subscribers.length === 0) return false;
      
      const formattedProducts = products.map(product => ({
        name: product.name,
        originalPrice: product.originalPrice.toFixed(2),
        discountPrice: product.price.toFixed(2),
        discountPercentage: Math.round((1 - (product.price / product.originalPrice)) * 100),
        imageUrl: product.mainImage,
        productUrl: `${process.env.FRONTEND_URL || 'https://puravidastore.com'}/products/${product.slug}`
      }));
      
      const currentYear = new Date().getFullYear();
      
      const html = await this.compileTemplate('promotions', {
        products: formattedProducts,
        unsubscribeUrl: `${process.env.FRONTEND_URL || 'https://puravidastore.com'}/unsubscribe`,
        storeUrl: process.env.FRONTEND_URL || 'https://puravidastore.com',
        currentYear
      });
      
      // Enviar a todos los suscriptores usando copia oculta (BCC)
      return await this.sendEmail({
        to: process.env.EMAIL_FROM || 'noreply@puravidastore.com',
        bcc: subscribers.map(sub => sub.email).join(','),
        subject: '¡Ofertas especiales! - Pura Vida Store',
        html,
        text: `¡Aproveche nuestras ofertas especiales por tiempo limitado!`
      });
    } catch (error) {
      console.error('Error al enviar notificación de promociones:', error);
      return false;
    }
  }
}

// Crear una instancia única del servicio
const emailService = new EmailNotificationService();

export default emailService; 