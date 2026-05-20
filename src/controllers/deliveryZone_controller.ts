import DeliveryZone from '../models/model_deliveryZone';
import logger from '../configs/logger';
import { Request, Response } from 'express';

/**
 * Obtener todas las zonas de delivery
 */
export const getAllDeliveryZones = async (req: Request, res: Response) => {
  try {
    const { enabled } = req.query;
    const where: any = {};
    if (enabled !== undefined) where.enabled = enabled === 'true';

    const zones = await DeliveryZone.findAll({
      where,
      order: [['name', 'ASC']],
    });

    res.json({ success: true, data: zones });
  } catch (error: unknown) {
    logger.error('Error al obtener zonas de delivery', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener zonas de delivery' });
  }
};

/**
 * Obtener zona de delivery por ID
 */
export const getDeliveryZoneById = async (req: Request, res: Response) => {
  try {
    const zone = await DeliveryZone.findByPk(Number(req.params.id));
    if (!zone) {
      return res.status(404).json({ success: false, error: 'Zona de delivery no encontrada' });
    }
    res.json({ success: true, data: zone });
  } catch (error: unknown) {
    logger.error('Error al obtener zona de delivery', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener zona de delivery' });
  }
};

/**
 * Crear nueva zona de delivery
 */
export const createDeliveryZone = async (req: Request, res: Response) => {
  try {
    const { name, shippingFee, minimumOrder, estimatedTime, enabled } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'El nombre es requerido' });
    }

    const zone = await DeliveryZone.create({ name, shippingFee, minimumOrder, estimatedTime, enabled });
    res.status(201).json({ success: true, data: zone });
  } catch (error: unknown) {
    logger.error('Error al crear zona de delivery', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al crear zona de delivery' });
  }
};

/**
 * Actualizar zona de delivery
 */
export const updateDeliveryZone = async (req: Request, res: Response) => {
  try {
    const zone = await DeliveryZone.findByPk(Number(req.params.id));
    if (!zone) {
      return res.status(404).json({ success: false, error: 'Zona de delivery no encontrada' });
    }

    const { name, shippingFee, minimumOrder, estimatedTime, enabled } = req.body;
    await zone.update({ name, shippingFee, minimumOrder, estimatedTime, enabled });

    res.json({ success: true, data: zone });
  } catch (error: unknown) {
    logger.error('Error al actualizar zona de delivery', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al actualizar zona de delivery' });
  }
};

/**
 * Eliminar zona de delivery
 */
export const deleteDeliveryZone = async (req: Request, res: Response) => {
  try {
    const zone = await DeliveryZone.findByPk(Number(req.params.id));
    if (!zone) {
      return res.status(404).json({ success: false, error: 'Zona de delivery no encontrada' });
    }

    await zone.destroy();
    res.json({ success: true, message: 'Zona de delivery eliminada' });
  } catch (error: unknown) {
    logger.error('Error al eliminar zona de delivery', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al eliminar zona de delivery' });
  }
};
