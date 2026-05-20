import PaymentMethod from '../models/model_paymentMethod';
import logger from '../configs/logger';
import { Request, Response } from 'express';

/**
 * Obtener todos los métodos de pago
 */
export const getAllPaymentMethods = async (req: Request, res: Response) => {
  try {
    const { enabled } = req.query;
    const where: any = {};
    if (enabled !== undefined) where.enabled = enabled === 'true';

    const methods = await PaymentMethod.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['createdAt', 'ASC']],
    });

    res.json({ success: true, data: methods });
  } catch (error: unknown) {
    logger.error('Error al obtener métodos de pago', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener métodos de pago' });
  }
};

/**
 * Obtener método de pago por ID
 */
export const getPaymentMethodById = async (req: Request, res: Response) => {
  try {
    const method = await PaymentMethod.findByPk(Number(req.params.id));
    if (!method) {
      return res.status(404).json({ success: false, error: 'Método de pago no encontrado' });
    }
    res.json({ success: true, data: method });
  } catch (error: unknown) {
    logger.error('Error al obtener método de pago', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener método de pago' });
  }
};

/**
 * Crear nuevo método de pago
 */
export const createPaymentMethod = async (req: Request, res: Response) => {
  try {
    const { slug, label, enabled, config, sortOrder } = req.body;

    if (!slug || !label) {
      return res.status(400).json({ success: false, error: 'slug y label son requeridos' });
    }

    const existing = await PaymentMethod.findOne({ where: { slug } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Ya existe un método con ese slug' });
    }

    const method = await PaymentMethod.create({ slug, label, enabled, config, sortOrder });
    res.status(201).json({ success: true, data: method });
  } catch (error: unknown) {
    logger.error('Error al crear método de pago', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al crear método de pago' });
  }
};

/**
 * Actualizar método de pago
 */
export const updatePaymentMethod = async (req: Request, res: Response) => {
  try {
    const method = await PaymentMethod.findByPk(Number(req.params.id));
    if (!method) {
      return res.status(404).json({ success: false, error: 'Método de pago no encontrado' });
    }

    const { label, enabled, config, sortOrder } = req.body;
    await method.update({ label, enabled, config, sortOrder });

    res.json({ success: true, data: method });
  } catch (error: unknown) {
    logger.error('Error al actualizar método de pago', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al actualizar método de pago' });
  }
};

/**
 * Eliminar método de pago
 */
export const deletePaymentMethod = async (req: Request, res: Response) => {
  try {
    const method = await PaymentMethod.findByPk(Number(req.params.id));
    if (!method) {
      return res.status(404).json({ success: false, error: 'Método de pago no encontrado' });
    }

    await method.destroy();
    res.json({ success: true, message: 'Método de pago eliminado' });
  } catch (error: unknown) {
    logger.error('Error al eliminar método de pago', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al eliminar método de pago' });
  }
};
