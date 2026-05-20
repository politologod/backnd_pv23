// @ts-nocheck
import Banner from '../models/model_banner';
import MediaAsset from '../models/model_mediaAsset';
import { uploadImage, deleteImage } from '../utils/cloudinaryConfig';
import logger from '../configs/logger';
import { Request, Response } from 'express';

// ===================== BANNERS =====================

/**
 * GET /api/admin/banners
 */
export const getAllBanners = async (req: Request, res: Response) => {
  try {
    const { position, isActive } = req.query;
    const where: any = {};
    if (position) where.position = position;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const banners = await Banner.findAll({
      where,
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });

    res.json({ success: true, data: banners });
  } catch (error: unknown) {
    logger.error('Error getting banners', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener banners' });
  }
};

/**
 * POST /api/admin/banners
 */
export const createBanner = async (req: Request, res: Response) => {
  try {
    const { name, imageUrl, linkUrl, altText, position, schedule, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'El nombre es requerido' });
    }

    // Si hay archivo subido, usar Cloudinary
    let finalImageUrl = imageUrl;
    let imagePublicId = null;

    if (req.file) {
      const result = await uploadImage(req.file.path, {
        folder: 'banners',
        tags: ['banner', name],
      });
      finalImageUrl = result.secure_url;
      imagePublicId = result.public_id;
    }

    if (!finalImageUrl) {
      return res.status(400).json({ success: false, error: 'Se requiere una imagen (imageUrl o archivo)' });
    }

    const maxOrder = await Banner.max('sortOrder') || 0;
    const banner = await Banner.create({
      name,
      imageUrl: finalImageUrl,
      imagePublicId,
      linkUrl,
      altText,
      position: position || 'inline',
      schedule: schedule || null,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: (maxOrder as number) + 1,
    });

    res.status(201).json({ success: true, data: banner });
  } catch (error: unknown) {
    logger.error('Error creating banner', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al crear banner' });
  }
};

/**
 * PUT /api/admin/banners/:id
 */
export const updateBanner = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findByPk(Number(req.params.id));
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner no encontrado' });
    }

    const updates: any = { ...req.body };

    // Si hay nueva imagen
    if (req.file) {
      // Eliminar imagen anterior de Cloudinary
      if (banner.imagePublicId) {
        await deleteImage(banner.imagePublicId).catch(() => {});
      }
      const result = await uploadImage(req.file.path, {
        folder: 'banners',
        tags: ['banner'],
      });
      updates.imageUrl = result.secure_url;
      updates.imagePublicId = result.public_id;
    }

    await banner.update(updates);
    res.json({ success: true, data: banner });
  } catch (error: unknown) {
    logger.error('Error updating banner', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al actualizar banner' });
  }
};

/**
 * DELETE /api/admin/banners/:id
 */
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findByPk(Number(req.params.id));
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner no encontrado' });
    }

    // Eliminar de Cloudinary
    if (banner.imagePublicId) {
      await deleteImage(banner.imagePublicId).catch(() => {});
    }

    await banner.destroy();
    res.json({ success: true, message: 'Banner eliminado' });
  } catch (error: unknown) {
    logger.error('Error deleting banner', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al eliminar banner' });
  }
};

// ===================== MEDIA LIBRARY =====================

/**
 * GET /api/admin/media
 */
export const getAllMedia = async (req: Request, res: Response) => {
  try {
    const { folder, type, page = '1', limit = '20' } = req.query;
    const where: any = {};
    if (folder) where.folder = folder;
    if (type) where.type = type;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const { count, rows } = await MediaAsset.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        totalPages: Math.ceil(count / parseInt(limit as string)),
      },
    });
  } catch (error: unknown) {
    logger.error('Error getting media', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener archivos' });
  }
};

/**
 * POST /api/admin/media/upload
 * Soporta single y múltiple
 */
export const uploadMedia = async (req: Request, res: Response) => {
  try {
    const files = req.files ? (Array.isArray(req.files) ? req.files : [req.files]) : req.file ? [req.file] : [];

    if (files.length === 0) {
      return res.status(400).json({ success: false, error: 'No se proporcionaron archivos' });
    }

    const { folder = 'general', alt, tags } = req.body;
    const userId = (req as any).user?.id_autoincrement || (req as any).user?.id;

    const uploaded = await Promise.all(
      files.map(async (file: any) => {
        const result = await uploadImage(file.path, {
          folder: `storefront/${folder}`,
          tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
        });

        return MediaAsset.create({
          filename: file.originalname,
          url: result.secure_url,
          publicId: result.public_id,
          type: file.mimetype?.startsWith('video') ? 'video' : 'image',
          mimeType: file.mimetype,
          size: file.size,
          width: result.width,
          height: result.height,
          alt: alt || file.originalname,
          folder,
          tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
          uploadedBy: userId,
        });
      })
    );

    res.status(201).json({ success: true, data: uploaded });
  } catch (error: unknown) {
    logger.error('Error uploading media', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al subir archivos' });
  }
};

/**
 * PUT /api/admin/media/:id
 */
export const updateMedia = async (req: Request, res: Response) => {
  try {
    const asset = await MediaAsset.findByPk(Number(req.params.id));
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
    }

    const { alt, tags, folder } = req.body;
    const updates: any = {};
    if (alt !== undefined) updates.alt = alt;
    if (tags !== undefined) updates.tags = tags;
    if (folder !== undefined) updates.folder = folder;

    await asset.update(updates);
    res.json({ success: true, data: asset });
  } catch (error: unknown) {
    logger.error('Error updating media', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al actualizar archivo' });
  }
};

/**
 * DELETE /api/admin/media/:id
 */
export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const asset = await MediaAsset.findByPk(Number(req.params.id));
    if (!asset) {
      return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
    }

    // Eliminar de Cloudinary
    if (asset.publicId) {
      await deleteImage(asset.publicId).catch(() => {});
    }

    await asset.destroy();
    res.json({ success: true, message: 'Archivo eliminado' });
  } catch (error: unknown) {
    logger.error('Error deleting media', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al eliminar archivo' });
  }
};
