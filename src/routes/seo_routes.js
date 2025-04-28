const express = require('express');
const router = express.Router();
const seoController = require('../controllers/seo_controller');

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

module.exports = router; 