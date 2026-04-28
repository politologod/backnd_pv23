import nodemailer from 'nodemailer';
import {  logger  } from '../configs/logger';
require('dotenv').config();

// Configuración del transporter de correo
let transporter;

// Inicializar el transporter según el entorno
const initTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Configuración para producción con proveedor real
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } else {
    // Configuración para desarrollo usando Ethereal
    nodemailer.createTestAccount().then(testAccount => {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      logger.info('Cuenta de prueba de email creada', {
        user: testAccount.user,
        previewURL: 'https://ethereal.email'
      });
    }).catch(error => {
      logger.error('Error al crear cuenta de prueba de email', { error: error.message });
    });
  }
};

// Inicializar el transporter
initTransporter();

/**
 * Envía un correo electrónico
 * @param {Object} options - Opciones del correo
 * @param {string} options.to - Destinatario del correo
 * @param {string} options.subject - Asunto del correo
 * @param {string} options.text - Versión plana del correo
 * @param {string} options.html - Versión HTML del correo
 * @param {string} [options.from] - Remitente del correo (opcional, usa el default si no se especifica)
 * @param {Array<Object>} [options.attachments] - Archivos adjuntos (opcional)
 * @returns {Promise<Object>} - Información del envío
 */
const sendEmail = async (options) => {
  try {
    // Si el transporter no está inicializado, inicializarlo
    if (!transporter) {
      await initTransporter();
      
      // Si aún no está disponible, esperar 1 segundo
      if (!transporter) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Si todavía no está disponible, lanzar error
        if (!transporter) {
          throw new Error('No se pudo inicializar el transporter de correo');
        }
      }
    }
    
    const mailOptions = {
      from: options.from || `"${process.env.EMAIL_SENDER_NAME || 'Pura Vida Store'}" <${process.env.EMAIL_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments || []
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    logger.info('Correo enviado correctamente', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject
    });
    
    // Para entorno de desarrollo, mostrar la URL de vista previa
    if (process.env.NODE_ENV !== 'production') {
      logger.info('URL de vista previa', {
        previewURL: nodemailer.getTestMessageUrl(info)
      });
    }
    
    return info;
  } catch (error) {
    logger.error('Error al enviar correo', {
      to: options.to,
      subject: options.subject,
      error: error.message
    });
    throw error;
  }
};

export default {
  sendEmail
}; 