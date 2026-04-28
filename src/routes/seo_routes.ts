import express from 'express';
const router = express.Router();
import * as seoController from '../controllers/seo_controller';

/**
 * @route GET /robots.txt
 * @desc Devuelve el archivo robots.txt
 * @access Público
 */
router.get('/robots.txt', seoController.getRobotsTxt);

/**
 * @route GET /sitemap.xml
 * @desc Devuelve el sitemap XML
 * @access Público
 */
router.get('/sitemap.xml', seoController.getSitemap);

export default router; 