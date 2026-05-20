// @ts-nocheck
import { Router } from 'express';
import * as storefrontController from '../controllers/storefront_controller';

const router = Router();

/**
 * @swagger
 * /api/storefront/config:
 *   get:
 *     summary: Bootstrap completo del storefront (theme + nav + branding)
 *     tags: [Storefront]
 */
router.get('/config', storefrontController.getStorefrontConfig);

/**
 * @swagger
 * /api/storefront/pages:
 *   get:
 *     summary: Lista de páginas publicadas
 *     tags: [Storefront]
 */
router.get('/pages', storefrontController.getPublishedPages);

/**
 * @swagger
 * /api/storefront/pages/:slug:
 *   get:
 *     summary: Página con sus secciones por slug
 *     tags: [Storefront]
 */
router.get('/pages/:slug', storefrontController.getPageBySlug);

/**
 * @swagger
 * /api/storefront/banners:
 *   get:
 *     summary: Banners activos (con filtro por position y schedule)
 *     tags: [Storefront]
 */
router.get('/banners', storefrontController.getActiveBanners);

/**
 * @swagger
 * /api/storefront/banners/:id/track:
 *   post:
 *     summary: Registrar click en banner
 *     tags: [Storefront]
 */
router.post('/banners/:id/track', storefrontController.trackBannerClick);

/**
 * @swagger
 * /api/storefront/navigation:
 *   get:
 *     summary: Navegación pública (header + footer)
 *     tags: [Storefront]
 */
router.get('/navigation', storefrontController.getNavigation);

export default router;
