/**
 * Módulo para manejar las plantillas de correos electrónicos
 */

/**
 * Genera una plantilla base para todos los correos
 * @param {Object} options - Opciones de la plantilla
 * @param {string} options.title - Título del correo
 * @param {string} options.content - Contenido HTML del correo
 * @param {string} options.footerText - Texto del pie de página (opcional)
 * @param {string} options.logoUrl - URL del logo (opcional)
 * @returns {string} - HTML de la plantilla completa
 */
const baseTemplate = (options) => {
  const logoUrl = options.logoUrl || 'https://placehold.co/600x150?text=Pura+Vida+Store';
  const footerText = options.footerText || '© Pura Vida Store. Todos los derechos reservados.';
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.title}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: #27ae60;
          color: #fff;
          padding: 20px;
          text-align: center;
        }
        .logo {
          max-width: 200px;
          height: auto;
        }
        .content {
          padding: 30px;
        }
        .footer {
          background-color: #f5f5f5;
          padding: 15px;
          text-align: center;
          color: #666;
          font-size: 0.8rem;
        }
        .button {
          display: inline-block;
          background-color: #27ae60;
          color: #fff;
          text-decoration: none;
          padding: 12px 25px;
          border-radius: 4px;
          margin: 20px 0;
          font-weight: bold;
        }
        .highlight {
          background-color: #f8f9fa;
          border-left: 4px solid #27ae60;
          padding: 15px;
          margin: 20px 0;
        }
        @media only screen and (max-width: 600px) {
          .container {
            width: 100%;
            border-radius: 0;
          }
          .content {
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${logoUrl}" alt="Pura Vida Store" class="logo">
        </div>
        <div class="content">
          ${options.content}
        </div>
        <div class="footer">
          ${footerText}
          <p>Si no has solicitado este correo, puedes ignorarlo.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Genera una plantilla para bienvenida de nuevos usuarios
 * @param {Object} options - Opciones de la plantilla
 * @param {string} options.name - Nombre del usuario
 * @param {string} options.loginUrl - URL para iniciar sesión
 * @returns {string} - HTML de la plantilla
 */
const welcomeTemplate = (options) => {
  const content = `
    <h1>¡Bienvenido/a a Pura Vida Store!</h1>
    <p>Hola ${options.name},</p>
    <p>Gracias por registrarte en nuestra tienda. Estamos emocionados de tenerte como cliente.</p>
    <p>Con tu cuenta puedes:</p>
    <ul>
      <li>Realizar compras de forma más rápida</li>
      <li>Guardar múltiples direcciones de envío</li>
      <li>Ver tus pedidos y su estado</li>
      <li>Acceder a ofertas exclusivas</li>
    </ul>
    <div style="text-align: center;">
      <a href="${options.loginUrl}" class="button">Iniciar Sesión</a>
    </div>
    <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
    <p>Saludos,<br>El equipo de Pura Vida Store</p>
  `;
  
  return baseTemplate({
    title: 'Bienvenido a Pura Vida Store',
    content,
    footerText: '© Pura Vida Store. Todos los derechos reservados.'
  });
};

/**
 * Genera una plantilla para restablecimiento de contraseña
 * @param {Object} options - Opciones de la plantilla
 * @param {string} options.name - Nombre del usuario
 * @param {string} options.resetUrl - URL para restablecer contraseña
 * @param {number} options.expiryHours - Horas hasta que expire el enlace
 * @returns {string} - HTML de la plantilla
 */
const passwordResetTemplate = (options) => {
  const content = `
    <h1>Restablecimiento de Contraseña</h1>
    <p>Hola ${options.name},</p>
    <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
    <div style="text-align: center;">
      <a href="${options.resetUrl}" class="button">Restablecer Contraseña</a>
    </div>
    <div class="highlight">
      <p>Este enlace expirará en ${options.expiryHours} horas.</p>
      <p>Si no has solicitado restablecer tu contraseña, puedes ignorar este correo.</p>
    </div>
    <p>Por razones de seguridad, no compartas este correo con nadie.</p>
    <p>Saludos,<br>El equipo de Pura Vida Store</p>
  `;
  
  return baseTemplate({
    title: 'Restablecimiento de Contraseña',
    content
  });
};

/**
 * Genera una plantilla para confirmación de orden
 * @param {Object} options - Opciones de la plantilla
 * @param {string} options.name - Nombre del cliente
 * @param {string} options.orderId - ID de la orden
 * @param {Array} options.items - Artículos de la orden
 * @param {Object} options.totals - Totales de la orden
 * @param {string} options.shippingAddress - Dirección de envío
 * @param {string} options.orderUrl - URL para ver la orden
 * @returns {string} - HTML de la plantilla
 */
const orderConfirmationTemplate = (options) => {
  // Generar HTML para los items
  const itemsHtml = options.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');
  
  const content = `
    <h1>¡Confirmación de Pedido!</h1>
    <p>Hola ${options.name},</p>
    <p>Tu pedido ha sido recibido y está siendo procesado. A continuación los detalles:</p>
    
    <div class="highlight">
      <strong>Número de Orden:</strong> ${options.orderId}<br>
      <strong>Fecha:</strong> ${new Date().toLocaleDateString()}
    </div>
    
    <h2>Artículos</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 10px; text-align: left;">Producto</th>
          <th style="padding: 10px; text-align: center;">Cantidad</th>
          <th style="padding: 10px; text-align: right;">Precio</th>
          <th style="padding: 10px; text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right;"><strong>Subtotal:</strong></td>
          <td style="padding: 10px; text-align: right;">$${options.totals.subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right;"><strong>Impuestos:</strong></td>
          <td style="padding: 10px; text-align: right;">$${options.totals.taxes.toFixed(2)}</td>
        </tr>
        <tr>
          <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
          <td style="padding: 10px; text-align: right; font-weight: bold;">$${options.totals.total.toFixed(2)}</td>
        </tr>
      </tfoot>
    </table>
    
    <h2>Dirección de Envío</h2>
    <p>${options.shippingAddress}</p>
    
    <div style="text-align: center;">
      <a href="${options.orderUrl}" class="button">Ver Pedido</a>
    </div>
    
    <p>Gracias por tu compra. Te notificaremos cuando tu pedido sea enviado.</p>
    <p>Saludos,<br>El equipo de Pura Vida Store</p>
  `;
  
  return baseTemplate({
    title: `Confirmación de Pedido #${options.orderId}`,
    content
  });
};

/**
 * Genera una plantilla para notificación de nuevo producto
 * @param {Object} options - Opciones de la plantilla
 * @param {string} options.productName - Nombre del producto
 * @param {string} options.productImage - Imagen del producto
 * @param {string} options.productDescription - Descripción del producto
 * @param {number} options.productPrice - Precio del producto
 * @param {string} options.productUrl - URL del producto
 * @returns {string} - HTML de la plantilla
 */
const newProductTemplate = (options) => {
  const content = `
    <h1>¡Nuevo Producto Disponible!</h1>
    <p>Acabamos de añadir un nuevo producto a nuestra tienda:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <img src="${options.productImage}" alt="${options.productName}" style="max-width: 100%; height: auto; border-radius: 8px; max-height: 300px;">
      <h2 style="margin: 15px 0;">${options.productName}</h2>
      <p style="font-weight: bold; font-size: 1.2rem; color: #27ae60;">$${options.productPrice.toFixed(2)}</p>
    </div>
    
    <p>${options.productDescription}</p>
    
    <div style="text-align: center;">
      <a href="${options.productUrl}" class="button">Ver Producto</a>
    </div>
    
    <p>No esperes demasiado, ¡podría agotarse!</p>
    <p>Saludos,<br>El equipo de Pura Vida Store</p>
  `;
  
  return baseTemplate({
    title: `Nuevo Producto: ${options.productName}`,
    content
  });
};

/**
 * Genera una plantilla para notificación de producto en oferta
 * @param {Object} options - Opciones de la plantilla
 * @param {string} options.productName - Nombre del producto
 * @param {string} options.productImage - Imagen del producto
 * @param {number} options.originalPrice - Precio original del producto
 * @param {number} options.salePrice - Precio de oferta del producto
 * @param {number} options.discountPercent - Porcentaje de descuento
 * @param {string} options.productUrl - URL del producto
 * @param {string} options.expiryDate - Fecha de expiración de la oferta
 * @returns {string} - HTML de la plantilla
 */
const productSaleTemplate = (options) => {
  const content = `
    <h1>¡Oferta Especial!</h1>
    <p>Tenemos una oferta especial solo por tiempo limitado:</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <div style="position: relative; display: inline-block;">
        <img src="${options.productImage}" alt="${options.productName}" style="max-width: 100%; height: auto; border-radius: 8px; max-height: 300px;">
        <div style="position: absolute; top: 10px; right: 10px; background-color: #e74c3c; color: white; padding: 10px; border-radius: 50%; font-weight: bold;">
          -${options.discountPercent}%
        </div>
      </div>
      <h2 style="margin: 15px 0;">${options.productName}</h2>
      <p>
        <span style="text-decoration: line-through; color: #777;">$${options.originalPrice.toFixed(2)}</span>
        <span style="font-weight: bold; font-size: 1.5rem; color: #e74c3c; margin-left: 10px;">$${options.salePrice.toFixed(2)}</span>
      </p>
    </div>
    
    <div class="highlight">
      <p>¡Esta oferta termina el ${options.expiryDate}!</p>
    </div>
    
    <div style="text-align: center;">
      <a href="${options.productUrl}" class="button">Comprar Ahora</a>
    </div>
    
    <p>No te pierdas esta oportunidad.</p>
    <p>Saludos,<br>El equipo de Pura Vida Store</p>
  `;
  
  return baseTemplate({
    title: `Oferta Especial: ${options.productName}`,
    content
  });
};

module.exports = {
  welcomeTemplate,
  passwordResetTemplate,
  orderConfirmationTemplate,
  newProductTemplate,
  productSaleTemplate
}; 