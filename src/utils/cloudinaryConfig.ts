import { v2 as cloudinary } from 'cloudinary';
require('dotenv').config();
import fs from 'fs';
import logger from '../configs/logger';

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Sube una imagen a Cloudinary
 * @param {string|Buffer} file - Ruta del archivo o buffer de la imagen
 * @param {Object} options - Opciones adicionales para la subida
 * @param {string} options.folder - Carpeta donde almacenar la imagen
 * @param {string} options.public_id - Identificador público personalizado (opcional)
 * @param {Array} options.tags - Etiquetas para la imagen
 * @returns {Promise<Object>} Resultado de la subida
 */
const uploadImage = async (file, options = {}) => {
  try {
    // Configurar opciones predeterminadas si no se especifican
    const uploadOptions = {
      folder: options.folder || 'uploads',
      resource_type: 'auto',
      tags: options.tags || [],
      ...(options.public_id && { public_id: options.public_id })
    };

    // Verificar si el archivo es un path o un buffer
    const isFilePath = typeof file === 'string';
    
    // Subir la imagen
    const result = await cloudinary.uploader.upload(file, uploadOptions);
    
    // Si se proporcionó una ruta de archivo, eliminar el archivo temporal después de subirlo
    if (isFilePath && fs.existsSync(file)) {
      fs.unlink(file, (err) => {
        if (err) {
          logger.error('Error al eliminar archivo temporal después de subir a Cloudinary', {
            error: err.message,
            file
          });
        }
      });
    }
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      version: result.version,
      format: result.format,
      resource_type: result.resource_type,
      created_at: result.created_at,
      bytes: result.bytes,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    logger.error('Error al subir imagen a Cloudinary:', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Sube una imagen de producto a Cloudinary
 * @param {string|Buffer} file - Ruta del archivo o buffer de la imagen
 * @param {string} productId - ID del producto
 * @returns {Promise<Object>} Resultado de la subida
 */
const uploadProductImage = async (file, productId) => {
  return uploadImage(file, {
    folder: 'products',
    public_id: `product_${productId}_${Date.now()}`,
    tags: ['product', `product_${productId}`]
  });
};

/**
 * Sube una imagen de comprobante de pago a Cloudinary
 * @param {string|Buffer} file - Ruta del archivo o buffer de la imagen
 * @param {string} orderId - ID de la orden
 * @returns {Promise<Object>} Resultado de la subida
 */
const uploadPaymentProof = async (file, orderId) => {
  return uploadImage(file, {
    folder: 'payment_proofs',
    public_id: `order_${orderId}_${Date.now()}`,
    tags: ['payment', `order_${orderId}`],
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
      { flags: 'attachment' } // Hace que la imagen sea descargable como adjunto
    ]
  });
};

/**
 * Sube múltiples imágenes de productos a Cloudinary
 * @param {Array<string>} files - Array de rutas o buffers de imágenes
 * @param {string} productId - ID del producto
 * @returns {Promise<Array<Object>>} Resultados de las subidas
 */
const uploadMultipleProductImages = async (files, productId) => {
  const uploadPromises = files.map(file => 
    uploadProductImage(file, productId)
  );
  
  return Promise.all(uploadPromises);
};

/**
 * Elimina una imagen de Cloudinary
 * @param {string} publicId - ID público de la imagen a eliminar
 * @returns {Promise<Object>} Resultado de la eliminación
 */
const deleteImage = async (publicId) => {
  try {
    // Validar que tenemos un publicId
    if (!publicId) {
      logger.error('Error al eliminar imagen: publicId no proporcionado');
      return {
        success: false,
        error: 'ID de imagen no proporcionado'
      };
    }
    
    logger.info('Intentando eliminar imagen de Cloudinary', { publicId });
    const result = await cloudinary.uploader.destroy(publicId);
    
    // Cloudinary puede devolver diferentes respuestas
    const success = result === 'ok' || result.result === 'ok';
    
    if (success) {
      logger.info('Imagen eliminada correctamente de Cloudinary', { publicId });
    } else {
      logger.warn('Respuesta inesperada de Cloudinary al eliminar imagen', { publicId, result });
    }
    
    return {
      success,
      result
    };
  } catch (error) {
    logger.error('Error al eliminar imagen de Cloudinary:', { 
      publicId, 
      error: error.message,
      stack: error.stack
    });
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Obtiene URLs firmadas para imágenes con restricciones
 * @param {string} publicId - ID público de la imagen
 * @param {Object} options - Opciones para la firma
 * @returns {string} URL firmada
 */
const getSignedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    expiresAt: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hora por defecto
    ...options
  };
  
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    ...defaultOptions
  });
};

export default {
  uploadImage,
  uploadProductImage,
  uploadPaymentProof,
  uploadMultipleProductImages,
  deleteImage,
  getSignedUrl,
  cloudinary // Exportamos la instancia configurada por si se necesita acceso directo
}; 