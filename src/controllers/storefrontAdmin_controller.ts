// @ts-nocheck
import ThemeConfig from '../models/model_themeConfig';
import StorefrontPage from '../models/model_storefrontPage';
import PageSection from '../models/model_pageSection';
import logger from '../configs/logger';
import { Request, Response } from 'express';

// ===================== THEME =====================

/**
 * GET /api/admin/theme
 */
export const getTheme = async (req: Request, res: Response) => {
  try {
    let theme = await ThemeConfig.findOne({
      where: { isActive: true },
      order: [['updatedAt', 'DESC']],
    });

    if (!theme) {
      theme = await ThemeConfig.create({
        name: 'default',
        isActive: true,
        isDraft: false,
        publishedAt: new Date(),
      });
    }

    res.json({ success: true, data: theme });
  } catch (error: unknown) {
    logger.error('Error getting theme', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener tema' });
  }
};

/**
 * PUT /api/admin/theme
 */
export const updateTheme = async (req: Request, res: Response) => {
  try {
    let theme = await ThemeConfig.findOne({ where: { isActive: true } });

    if (!theme) {
      theme = await ThemeConfig.create({
        name: 'default',
        isActive: true,
        isDraft: true,
        ...req.body,
      });
    } else {
      await theme.update({ ...req.body, isDraft: true });
    }

    res.json({ success: true, data: theme, message: 'Tema guardado como borrador' });
  } catch (error: unknown) {
    logger.error('Error updating theme', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al actualizar tema' });
  }
};

/**
 * POST /api/admin/theme/publish
 */
export const publishTheme = async (req: Request, res: Response) => {
  try {
    const theme = await ThemeConfig.findOne({ where: { isActive: true } });
    if (!theme) {
      return res.status(404).json({ success: false, error: 'No hay tema activo' });
    }

    await theme.update({ isDraft: false, publishedAt: new Date() });
    res.json({ success: true, data: theme, message: 'Tema publicado' });
  } catch (error: unknown) {
    logger.error('Error publishing theme', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al publicar tema' });
  }
};

// ===================== PAGES =====================

/**
 * GET /api/admin/pages
 */
export const getAllPages = async (req: Request, res: Response) => {
  try {
    const pages = await StorefrontPage.findAll({
      order: [['sortOrder', 'ASC'], ['createdAt', 'DESC']],
    });

    // Get section count per page
    const pagesWithCounts = await Promise.all(
      pages.map(async (page: any) => {
        const sectionCount = await PageSection.count({ where: { pageId: page.id } });
        return { ...page.toJSON(), sectionCount };
      })
    );

    res.json({ success: true, data: pagesWithCounts });
  } catch (error: unknown) {
    logger.error('Error getting pages', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener páginas' });
  }
};

/**
 * GET /api/admin/pages/:id
 */
export const getPageById = async (req: Request, res: Response) => {
  try {
    const page = await StorefrontPage.findByPk(Number(req.params.id));
    if (!page) {
      return res.status(404).json({ success: false, error: 'Página no encontrada' });
    }

    const sections = await PageSection.findAll({
      where: { pageId: page.id },
      order: [['sortOrder', 'ASC']],
    });

    res.json({ success: true, data: { ...page.toJSON(), sections } });
  } catch (error: unknown) {
    logger.error('Error getting page', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener página' });
  }
};

/**
 * POST /api/admin/pages
 */
export const createPage = async (req: Request, res: Response) => {
  try {
    const { slug, title, type, seo, isPublished } = req.body;

    if (!slug || !title) {
      return res.status(400).json({ success: false, error: 'slug y title son requeridos' });
    }

    const existing = await StorefrontPage.findOne({ where: { slug } });
    if (existing) {
      return res.status(409).json({ success: false, error: 'Ya existe una página con ese slug' });
    }

    const maxOrder = await StorefrontPage.max('sortOrder') || 0;
    const page = await StorefrontPage.create({
      slug,
      title,
      type: type || 'custom',
      seo: seo || {},
      isPublished: isPublished || false,
      sortOrder: (maxOrder as number) + 1,
    });

    res.status(201).json({ success: true, data: page });
  } catch (error: unknown) {
    logger.error('Error creating page', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al crear página' });
  }
};

/**
 * PUT /api/admin/pages/:id
 */
export const updatePage = async (req: Request, res: Response) => {
  try {
    const page = await StorefrontPage.findByPk(Number(req.params.id));
    if (!page) {
      return res.status(404).json({ success: false, error: 'Página no encontrada' });
    }

    const { title, seo, isPublished, sortOrder } = req.body;
    await page.update({ title, seo, isPublished, sortOrder });

    res.json({ success: true, data: page });
  } catch (error: unknown) {
    logger.error('Error updating page', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al actualizar página' });
  }
};

/**
 * DELETE /api/admin/pages/:id
 */
export const deletePage = async (req: Request, res: Response) => {
  try {
    const page = await StorefrontPage.findByPk(Number(req.params.id));
    if (!page) {
      return res.status(404).json({ success: false, error: 'Página no encontrada' });
    }

    // Cascade delete sections
    await PageSection.destroy({ where: { pageId: page.id } });
    await page.destroy();

    res.json({ success: true, message: 'Página y sus secciones eliminadas' });
  } catch (error: unknown) {
    logger.error('Error deleting page', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al eliminar página' });
  }
};

// ===================== SECTIONS =====================

/**
 * GET /api/admin/pages/:pageId/sections
 */
export const getPageSections = async (req: Request, res: Response) => {
  try {
    const sections = await PageSection.findAll({
      where: { pageId: Number(req.params.pageId) },
      order: [['sortOrder', 'ASC']],
    });

    res.json({ success: true, data: sections });
  } catch (error: unknown) {
    logger.error('Error getting sections', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener secciones' });
  }
};

/**
 * POST /api/admin/pages/:pageId/sections
 */
export const createSection = async (req: Request, res: Response) => {
  try {
    const pageId = Number(req.params.pageId);
    const page = await StorefrontPage.findByPk(pageId);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Página no encontrada' });
    }

    const { type, content, settings, isVisible } = req.body;
    if (!type) {
      return res.status(400).json({ success: false, error: 'El tipo de sección es requerido' });
    }

    const maxOrder = await PageSection.max('sortOrder', { where: { pageId } }) || 0;
    const section = await PageSection.create({
      pageId,
      type,
      content: content || {},
      settings: settings || {},
      isVisible: isVisible !== undefined ? isVisible : true,
      sortOrder: (maxOrder as number) + 1,
    });

    res.status(201).json({ success: true, data: section });
  } catch (error: unknown) {
    logger.error('Error creating section', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al crear sección' });
  }
};

/**
 * PUT /api/admin/sections/:id
 */
export const updateSection = async (req: Request, res: Response) => {
  try {
    const section = await PageSection.findByPk(Number(req.params.id));
    if (!section) {
      return res.status(404).json({ success: false, error: 'Sección no encontrada' });
    }

    const { content, settings, isVisible, sortOrder } = req.body;
    const updates: any = {};
    if (content !== undefined) updates.content = content;
    if (settings !== undefined) updates.settings = settings;
    if (isVisible !== undefined) updates.isVisible = isVisible;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;

    await section.update(updates);
    res.json({ success: true, data: section });
  } catch (error: unknown) {
    logger.error('Error updating section', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al actualizar sección' });
  }
};

/**
 * DELETE /api/admin/sections/:id
 */
export const deleteSection = async (req: Request, res: Response) => {
  try {
    const section = await PageSection.findByPk(Number(req.params.id));
    if (!section) {
      return res.status(404).json({ success: false, error: 'Sección no encontrada' });
    }

    await section.destroy();
    res.json({ success: true, message: 'Sección eliminada' });
  } catch (error: unknown) {
    logger.error('Error deleting section', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al eliminar sección' });
  }
};

/**
 * PUT /api/admin/pages/:pageId/sections/reorder
 * Body: { sectionIds: [3, 1, 5, 2] }
 */
export const reorderSections = async (req: Request, res: Response) => {
  try {
    const { sectionIds } = req.body;
    if (!Array.isArray(sectionIds)) {
      return res.status(400).json({ success: false, error: 'sectionIds debe ser un array' });
    }

    await Promise.all(
      sectionIds.map((id: number, index: number) =>
        PageSection.update({ sortOrder: index }, { where: { id, pageId: Number(req.params.pageId) } })
      )
    );

    res.json({ success: true, message: 'Secciones reordenadas' });
  } catch (error: unknown) {
    logger.error('Error reordering sections', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al reordenar secciones' });
  }
};

/**
 * PUT /api/admin/navigation
 */
export const updateNavigation = async (req: Request, res: Response) => {
  try {
    const { header, footer } = req.body;
    const theme = await ThemeConfig.findOne({ where: { isActive: true } });
    if (!theme) {
      return res.status(404).json({ success: false, error: 'No hay tema activo' });
    }

    const nav: any = { ...(theme.navigation as any) };
    if (header !== undefined) nav.header = header;
    if (footer !== undefined) nav.footer = footer;

    await theme.update({ navigation: nav });
    res.json({ success: true, data: nav, message: 'Navegación actualizada' });
  } catch (error: unknown) {
    logger.error('Error updating navigation', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al actualizar navegación' });
  }
};
