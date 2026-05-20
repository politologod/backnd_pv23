// @ts-nocheck
import ThemeConfig from '../models/model_themeConfig';
import StorefrontPage from '../models/model_storefrontPage';
import PageSection from '../models/model_pageSection';
import Banner from '../models/model_banner';
import logger from '../configs/logger';
import { Request, Response } from 'express';
import { Op } from 'sequelize';

/**
 * GET /api/storefront/config
 * Bootstrap completo del storefront en un solo call
 */
export const getStorefrontConfig = async (req: Request, res: Response) => {
  try {
    const theme = await ThemeConfig.findOne({
      where: { isActive: true, isDraft: false },
      order: [['publishedAt', 'DESC']],
    });

    if (!theme) {
      return res.json({
        success: true,
        data: {
          theme: null,
          navigation: { header: [], footer: [] },
          branding: {},
        },
      });
    }

    return res.json({
      success: true,
      data: {
        theme: {
          colors: theme.colors,
          typography: theme.typography,
          layout: theme.layout,
          customCss: theme.customCss,
        },
        navigation: theme.navigation,
        branding: theme.branding,
      },
    });
  } catch (error: unknown) {
    logger.error('Error getting storefront config', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener configuración del storefront' });
  }
};

/**
 * GET /api/storefront/pages
 * Lista de páginas publicadas
 */
export const getPublishedPages = async (req: Request, res: Response) => {
  try {
    const pages = await StorefrontPage.findAll({
      where: { isPublished: true },
      order: [['sortOrder', 'ASC']],
      attributes: ['id', 'slug', 'title', 'type', 'seo'],
    });

    res.json({ success: true, data: pages });
  } catch (error: unknown) {
    logger.error('Error getting published pages', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener páginas' });
  }
};

/**
 * GET /api/storefront/pages/:slug
 * Página con sus secciones (para renderizar en el storefront)
 */
export const getPageBySlug = async (req: Request, res: Response) => {
  try {
    const page = await StorefrontPage.findOne({
      where: { slug: req.params.slug, isPublished: true },
    });

    if (!page) {
      return res.status(404).json({ success: false, error: 'Página no encontrada' });
    }

    const sections = await PageSection.findAll({
      where: { pageId: page.id, isVisible: true },
      order: [['sortOrder', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        page: {
          id: page.id,
          slug: page.slug,
          title: page.title,
          type: page.type,
          seo: page.seo,
        },
        sections,
      },
    });
  } catch (error: unknown) {
    logger.error('Error getting page by slug', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener página' });
  }
};

/**
 * GET /api/storefront/banners
 * Banners activos (con filtro de schedule)
 */
export const getActiveBanners = async (req: Request, res: Response) => {
  try {
    const { position } = req.query;
    const where: any = { isActive: true };
    if (position) where.position = position;

    const banners = await Banner.findAll({
      where,
      order: [['sortOrder', 'ASC']],
    });

    // Filtrar por schedule (si tiene)
    const now = new Date();
    const filtered = banners.filter((b: any) => {
      if (!b.schedule) return true;
      const start = b.schedule.startDate ? new Date(b.schedule.startDate) : null;
      const end = b.schedule.endDate ? new Date(b.schedule.endDate) : null;
      if (start && now < start) return false;
      if (end && now > end) return false;
      return true;
    });

    // Incrementar impressions
    const ids = filtered.map((b: any) => b.id);
    if (ids.length > 0) {
      await Banner.increment('impressions', { where: { id: ids } });
    }

    res.json({ success: true, data: filtered });
  } catch (error: unknown) {
    logger.error('Error getting active banners', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener banners' });
  }
};

/**
 * POST /api/storefront/banners/:id/track
 * Registrar click en banner
 */
export const trackBannerClick = async (req: Request, res: Response) => {
  try {
    const banner = await Banner.findByPk(Number(req.params.id));
    if (!banner) {
      return res.status(404).json({ success: false, error: 'Banner no encontrado' });
    }

    await Banner.increment('clicks', { where: { id: banner.id } });
    res.json({ success: true });
  } catch (error: unknown) {
    logger.error('Error tracking banner click', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al registrar click' });
  }
};

/**
 * GET /api/storefront/navigation
 * Navegación pública (header + footer)
 */
export const getNavigation = async (req: Request, res: Response) => {
  try {
    const theme = await ThemeConfig.findOne({
      where: { isActive: true, isDraft: false },
      attributes: ['navigation'],
    });

    res.json({
      success: true,
      data: theme ? theme.navigation : { header: [], footer: [] },
    });
  } catch (error: unknown) {
    logger.error('Error getting navigation', { error: (error as Error).message });
    res.status(500).json({ success: false, error: 'Error al obtener navegación' });
  }
};
