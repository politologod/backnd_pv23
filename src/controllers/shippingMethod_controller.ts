import ShippingMethod from '../models/model_shippingMethod';
import logger from '../configs/logger';
import { Request, Response } from 'express';

/**
 * Obtener todos los métodos de envío
 */
export const getAllShippingMethods = async (req: Request, res: Response) => {
  try {
    const { enabled } = req.query;
    const where: any = {};
    if (enabled !== undefined) where.enabled = enabled === 'true';

    const methods = await ShippingMethod.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
    });

    res.json({ success: true, data: methods });
  } catch (error: unknown) {
    logger.error('Error al obtener métodos de envío', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener métodos de envío' });
  }
};

/**
 * Obtener método de envío por ID
 */
export const getShippingMethodById = async (req: Request, res: Response) => {
  try {
    const method = await ShippingMethod.findByPk(Number(req.params.id));
    if (!method) {
      return res.status(404).json({ success: false, error: 'Método de envío no encontrado' });
    }
    res.json({ success: true, data: method });
  } catch (error: unknown) {
    logger.error('Error al obtener método de envío', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener método de envío' });
  }
};

/**
 * Crear nuevo método de envío
 */
export const createShippingMethod = async (req: Request, res: Response) => {
  try {
    const { slug, label, enabled, config, sortOrder } = req.body;

    if (!slug || !label) {
      return res.status(400).json({ success: false, error: 'slug y label son requeridos' });
    }

    const existing = await ShippingMethod.findOne({ where: { slug } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Ya existe un método con ese slug' });
    }

    const method = await ShippingMethod.create({ slug, label, enabled, config, sortOrder });
    res.status(201).json({ success: true, data: method });
  } catch (error: unknown) {
    logger.error('Error al crear método de envío', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al crear método de envío' });
  }
};

/**
 * Actualizar método de envío
 */
export const updateShippingMethod = async (req: Request, res: Response) => {
  try {
    const method = await ShippingMethod.findByPk(Number(req.params.id));
    if (!method) {
      return res.status(404).json({ success: false, error: 'Método de envío no encontrado' });
    }

    const { label, enabled, config, sortOrder } = req.body;
    await method.update({ label, enabled, config, sortOrder });

    res.json({ success: true, data: method });
  } catch (error: unknown) {
    logger.error('Error al actualizar método de envío', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al actualizar método de envío' });
  }
};

/**
 * Eliminar método de envío
 */
export const deleteShippingMethod = async (req: Request, res: Response) => {
  try {
    const method = await ShippingMethod.findByPk(Number(req.params.id));
    if (!method) {
      return res.status(404).json({ success: false, error: 'Método de envío no encontrado' });
    }

    await method.destroy();
    res.json({ success: true, message: 'Método de envío eliminado' });
  } catch (error: unknown) {
    logger.error('Error al eliminar método de envío', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al eliminar método de envío' });
  }
};
