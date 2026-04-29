import { 
  uploadProductImage,
  uploadPaymentProof,
  uploadMultipleProductImages,
  deleteImage
 } from '../utils/cloudinaryConfig';
import logger from '../configs/logger';
import Product from '../models/model_products';
import Order from '../models/model_order';
import OrderStatusHistory from '../models/model_orderStatusHistory';
import sequelize from '../configs/database';
import { Request, Response } from 'express';


/**
 * Controlador para la subida de imágenes de productos
 */
const uploadProductImageController = async (req: Request, res: Response) => {
  try {
    // Verificar que se haya proporcionado un archivo
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se ha proporcionado ninguna imagen' 
      });
    }

    const { productId } = req.params;

    // Verificar que el producto existe
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }

    // Subir imagen a Cloudinary
    const result = await uploadProductImage(req.file.path, productId);

    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al subir la imagen', 
        error: result.error 
      });
    }

    // Actualizar la URL de la imagen en el producto
    await product.update({
      imageUrl: result.url,
      metadata: {
        ...product.metadata,
        imagePublicId: result.public_id
      }
    });

    res.status(200).json({
      success: true,
      message: 'Imagen subida correctamente',
      imageUrl: result.url,
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl
      }
    });
  } catch (error) {
    console.error('Error en uploadProductImageController', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error al procesar la imagen', 
      error: error.message 
    });
  }
};

/**
 * Controlador para la subida de múltiples imágenes de productos
 */
const uploadMultipleProductImagesController = async (req: Request, res: Response) => {
  try {
    // Verificar que se hayan proporcionado archivos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se han proporcionado imágenes' 
      });
    }

    const { productId } = req.params;

    // Verificar que el producto existe
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }

    // Subir imágenes a Cloudinary
    const filePaths = req.files.map(file => file.path);
    const results = await uploadMultipleProductImages(filePaths, productId);

    // Filtrar resultados exitosos
    const successfulUploads = results.filter(result => result.success);
    const failedUploads = results.filter(result => !result.success);

    if (successfulUploads.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'No se pudo subir ninguna imagen', 
        errors: failedUploads.map(result => result.error) 
      });
    }

    // Actualizar la URL de la imagen principal en el producto si no tiene ya una
    if (!product.imageUrl && successfulUploads.length > 0) {
      await product.update({
        imageUrl: successfulUploads[0].url
      });
    }

    // Actualizar metadata con todas las imágenes
    const currentMetadata = product.metadata || {};
    const currentImages = currentMetadata.additionalImages || [];
    
    const newImages = successfulUploads.map(upload => ({
      url: upload.url,
      publicId: upload.public_id
    }));

    await product.update({
      metadata: {
        ...currentMetadata,
        additionalImages: [...currentImages, ...newImages]
      }
    });

    res.status(200).json({
      success: true,
      message: `${successfulUploads.length} de ${req.files.length} imágenes subidas correctamente`,
      images: successfulUploads.map(upload => ({
        url: upload.url,
        publicId: upload.public_id
      })),
      failedUploads: failedUploads.length > 0 ? failedUploads.length : 0,
      product: {
        id: product.id,
        name: product.name,
        imageUrl: product.imageUrl
      }
    });
  } catch (error) {
    console.error('Error en uploadMultipleProductImagesController', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error al procesar las imágenes', 
      error: error.message 
    });
  }
};

/**
 * Controlador para la subida de comprobantes de pago
 */
const uploadPaymentProofController = async (req: Request, res: Response) => {
  try {
    // Verificar que se haya proporcionado un archivo
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No se ha proporcionado ninguna imagen' 
      });
    }

    const { orderId } = req.params;

    // Verificar que la orden existe
    const order = await Order.findByPk(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Orden no encontrada' 
      });
    }

    // Verificar que la orden pertenece al usuario actual
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para modificar esta orden' 
      });
    }

    // Subir imagen a Cloudinary
    const result = await uploadPaymentProof(req.file.path, orderId);

    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: 'Error al subir el comprobante de pago', 
        error: result.error 
      });
    }

    // Iniciar transacción
    const transaction = await sequelize.transaction();
    
    try {
      // Si ya existía un comprobante, eliminar el anterior
      if (order.paymentProofPublicId) {
        await deleteImage(order.paymentProofPublicId);
      }
      
      // Verificar si la orden está pendiente por pagar
      const statusChanged = order.status === 'pendiente por pagar';
      const newStatus = statusChanged ? 'pagado y procesando' : order.status;
  
      // Obtener datos adicionales del pago del body
      const {
        payerCedula,
        payerBankAccount,
        payerPhone,
        payerName,
        payerBank,
        transactionLastDigits,
        paymentNotes
      } = req.body;

      // Crear objeto de actualización con los datos del comprobante
      const updateData = {
        paymentProofUrl: result.url,
        paymentProofPublicId: result.public_id,
        paymentDate: new Date(),
        status: newStatus
      };

      // Añadir campos adicionales solo si vienen en la solicitud
      if (payerCedula) updateData.payerCedula = payerCedula;
      if (payerBankAccount) updateData.payerBankAccount = payerBankAccount;
      if (payerPhone) updateData.payerPhone = payerPhone;
      if (payerName) updateData.payerName = payerName;
      if (payerBank) updateData.payerBank = payerBank;
      if (transactionLastDigits) updateData.transactionLastDigits = transactionLastDigits;
      if (paymentNotes) updateData.paymentNotes = paymentNotes;

      // Actualizar la orden con todos los datos
      await order.update(updateData, { transaction });
  
      // Construir un mensaje detallado para el historial
      let paymentDetailsMsg = 'Comprobante de pago subido por el cliente';
      
      if (payerName) paymentDetailsMsg += `, Nombre: ${payerName}`;
      if (payerBank) paymentDetailsMsg += `, Banco: ${payerBank}`;
      if (transactionLastDigits) paymentDetailsMsg += `, Últimos dígitos: ${transactionLastDigits}`;
      
      // Si cambió el estado, registrar en el historial
      if (statusChanged) {
        await OrderStatusHistory.create({
          orderId: order.id,
          status: newStatus,
          notes: paymentDetailsMsg,
          updatedBy: req.user.id,
          updatedByRole: req.user.role
        }, { transaction });
      }
      
      // Confirmar transacción
      await transaction.commit();
      
      // Obtener la orden actualizada con su historial
      const updatedOrder = await Order.findByPk(order.id, {
        include: [
          { 
            model: OrderStatusHistory,
            limit: 5,
            order: [['createdAt', 'DESC']]
          }
        ]
      });
  
      res.status(200).json({
        success: true,
        message: 'Comprobante de pago subido correctamente',
        order: {
          id: order.id,
          status: order.status,
          paymentProofUrl: order.paymentProofUrl,
          paymentDate: order.paymentDate,
          history: updatedOrder.OrderStatusHistories
        }
      });
    } catch (error) {
      // Revertir transacción en caso de error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error en uploadPaymentProofController', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Error al procesar el comprobante de pago', 
      error: error.message 
    });
  }
};

/**
 * Controlador para eliminar una imagen de producto
 */
const deleteProductImageController = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    // Obtener el ID de la imagen del query o de los params
    const imageId = req.query.publicId || req.params.imageId;
    const isMain = req.query.isMain === 'true';
    
    console.log('Intentando eliminar imagen:', { productId, imageId, isMain });

    // Verificar que el producto existe
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Producto no encontrado' 
      });
    }
    
    // Si no hay metadata, no hay imágenes
    if (!product.metadata) {
      return res.status(404).json({ 
        success: false, 
        message: 'El producto no tiene imágenes asociadas' 
      });
    }
    
    let targetImageId;
    let isMainImage = false;
    
    // Si se especificó que es imagen principal o coincide el ID
    if (isMain || (product.metadata.imagePublicId === imageId)) {
      isMainImage = true;
      targetImageId = product.metadata.imagePublicId;
    } else if (product.metadata.additionalImages) {
      // Buscar en imágenes adicionales
      const imageIndex = product.metadata.additionalImages.findIndex(img => img.publicId === imageId);
      
      if (imageIndex === -1) {
        return res.status(404).json({ 
          success: false, 
          message: 'Imagen no encontrada para este producto',
          debug: {
            imageId,
            availableImages: [
              product.metadata.imagePublicId,
              ...product.metadata.additionalImages.map(img => img.publicId)
            ]
          }
        });
      }
      
      targetImageId = product.metadata.additionalImages[imageIndex].publicId;
    } else {
      return res.status(404).json({ 
        success: false, 
        message: 'El producto no tiene imágenes adicionales' 
      });
    }
    
    console.log('Imagen encontrada, intentando eliminar:', targetImageId);
    
    // Eliminar de Cloudinary
    try {
      const result = await deleteImage(targetImageId);
      
      if (!result.success) {
        return res.status(500).json({ 
          success: false, 
          message: 'Error al eliminar la imagen en Cloudinary', 
          error: result.error 
        });
      }
      
      console.log('Imagen eliminada de Cloudinary correctamente');
    } catch (cloudinaryError) {
      console.error('Error al eliminar la imagen de Cloudinary:', cloudinaryError);
      // Continuamos incluso si falla Cloudinary para actualizar la BD
    }
    
    // Actualizar producto según si es principal o adicional
    if (isMainImage) {
      // Es la imagen principal
      const metadata = { ...product.metadata };
      delete metadata.imagePublicId;
      
      // Si hay imágenes adicionales, usar la primera como principal
      let newMainImageUrl = null;
      let newMainImageId = null;
      
      if (metadata.additionalImages && metadata.additionalImages.length > 0) {
        const firstImage = metadata.additionalImages[0];
        newMainImageUrl = firstImage.url;
        newMainImageId = firstImage.publicId;
        metadata.imagePublicId = newMainImageId;
        metadata.additionalImages = metadata.additionalImages.slice(1);
      }
      
      await product.update({
        imageUrl: newMainImageUrl,
        metadata
      });
      
      return res.status(200).json({
        success: true,
        message: 'Imagen principal eliminada correctamente',
        product: {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl
        }
      });
    } else {
      // Es una imagen adicional
      const metadata = { ...product.metadata };
      const imageIndex = metadata.additionalImages.findIndex(img => img.publicId === imageId);
      
      metadata.additionalImages = [
        ...metadata.additionalImages.slice(0, imageIndex),
        ...metadata.additionalImages.slice(imageIndex + 1)
      ];
      
      await product.update({ metadata });
      
      return res.status(200).json({
        success: true,
        message: 'Imagen adicional eliminada correctamente',
        product: {
          id: product.id,
          name: product.name,
          imageUrl: product.imageUrl
        }
      });
    }
  } catch (error) {
    console.error('Error en deleteProductImageController:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al eliminar la imagen', 
      error: error.message 
    });
  }
};

export {
  uploadProductImageController,
  uploadMultipleProductImagesController,
  uploadPaymentProofController,
  deleteProductImageController
}; 