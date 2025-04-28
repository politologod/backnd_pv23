const Product = require('../models/model_products');
const Category = require('../models/model_category');
const { logger } = require('../configs/logger');

/**
 * Genera el archivo robots.txt
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getRobotsTxt = async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    // Configuración para un robots.txt básico
    // Ajusta las reglas según tus necesidades específicas
    const robotsTxt = `# www.robotstxt.org/
# This file is to prevent the crawling and indexing of certain parts
# of your site by web robots.

User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /*?*

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml
`;
    
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  } catch (error) {
    logger.error('Error al generar robots.txt', { error: error.message });
    res.status(500).send('Error al generar robots.txt');
  }
};

/**
 * Genera el sitemap XML
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getSitemap = async (req, res) => {
  try {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const now = new Date().toISOString();
    
    // Iniciar el XML del sitemap
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
    
    // Agregar URL principal
    xml += `
      <url>
        <loc>${baseUrl}</loc>
        <lastmod>${now}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
      </url>
    `;
    
    // Obtener todas las categorías activas
    const categories = await Category.findAll();
    categories.forEach(category => {
      xml += `
        <url>
          <loc>${baseUrl}/categories/${category.id}</loc>
          <lastmod>${category.updatedAt.toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    });
    
    // Obtener todos los productos
    const products = await Product.findAll();
    products.forEach(product => {
      xml += `
        <url>
          <loc>${baseUrl}/products/${product.id}</loc>
          <lastmod>${product.updatedAt.toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
        </url>
      `;
    });
    
    // Agregar otras páginas estáticas importantes
    const staticPages = [
      { url: '/about', priority: '0.5', changefreq: 'monthly' },
      { url: '/contact', priority: '0.5', changefreq: 'monthly' },
      { url: '/shipping', priority: '0.6', changefreq: 'monthly' },
      { url: '/returns', priority: '0.6', changefreq: 'monthly' },
      { url: '/terms', priority: '0.4', changefreq: 'monthly' },
      { url: '/privacy', priority: '0.4', changefreq: 'monthly' },
    ];
    
    staticPages.forEach(page => {
      xml += `
        <url>
          <loc>${baseUrl}${page.url}</loc>
          <lastmod>${now}</lastmod>
          <changefreq>${page.changefreq}</changefreq>
          <priority>${page.priority}</priority>
        </url>
      `;
    });
    
    // Cerrar el XML
    xml += '</urlset>';
    
    // Enviar la respuesta
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    logger.error('Error al generar sitemap.xml', { error: error.message });
    res.status(500).send('Error al generar sitemap.xml');
  }
};

module.exports = {
  getRobotsTxt,
  getSitemap
}; 