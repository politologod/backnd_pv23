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
    
    // Configuración para un robots.txt más completo
    const robotsTxt = `# www.robotstxt.org/
# Archivo de configuración para bots/crawlers

User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /cart/
Disallow: /checkout/
Disallow: /my-account/
Disallow: /search
Disallow: /*?*
Disallow: /*&*
Disallow: /*/track/*
Disallow: /*/login
Disallow: /*/register

# Bloquear bots específicos que pueden consumir muchos recursos
User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10

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
 * Genera el sitemap XML optimizado
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
const getSitemap = async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`;
    const now = new Date().toISOString();
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString();
    
    // Iniciar el XML del sitemap con la declaración de espacios de nombres adecuada
    let xml = '<?xml version="1.0" encoding="UTF-8"?>';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ';
    xml += 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" ';
    xml += 'xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" ';
    xml += 'xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 ';
    xml += 'http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd ';
    xml += 'http://www.google.com/schemas/sitemap-image/1.1 ';
    xml += 'http://www.google.com/schemas/sitemap-image/1.1/sitemap-image.xsd">';
    
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
    const categories = await Category.findAll({
      order: [['updatedAt', 'DESC']]
    });
    
    categories.forEach(category => {
      xml += `
        <url>
          <loc>${baseUrl}/categories/${category.slug || category.id}</loc>
          <lastmod>${category.updatedAt.toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.8</priority>
        </url>
      `;
    });
    
    // Obtener todos los productos activos, ordenados por fecha de actualización
    const products = await Product.findAll({
      where: { active: true },
      order: [['updatedAt', 'DESC']],
      limit: 1000 // Limitar a 1000 productos para evitar sitemap demasiado grande
    });
    
    products.forEach(product => {
      xml += `
        <url>
          <loc>${baseUrl}/products/${product.slug || product.id}</loc>
          <lastmod>${product.updatedAt.toISOString()}</lastmod>
          <changefreq>weekly</changefreq>
          <priority>0.7</priority>
          ${product.image ? `
          <image:image>
            <image:loc>${product.image}</image:loc>
            <image:title>${escapeXml(product.name)}</image:title>
            <image:caption>${escapeXml(product.description ? product.description.substring(0, 100) : product.name)}</image:caption>
          </image:image>
          ` : ''}
        </url>
      `;
    });
    
    // Agregar colecciones especiales y páginas de temporada
    const collections = [
      { url: '/collections/new-arrivals', name: 'Nuevos Productos', priority: '0.8', changefreq: 'daily' },
      { url: '/collections/sale', name: 'Ofertas', priority: '0.8', changefreq: 'daily' },
      { url: '/collections/featured', name: 'Productos Destacados', priority: '0.7', changefreq: 'weekly' },
      { url: '/collections/best-sellers', name: 'Más Vendidos', priority: '0.7', changefreq: 'weekly' },
    ];
    
    collections.forEach(collection => {
      xml += `
        <url>
          <loc>${baseUrl}${collection.url}</loc>
          <lastmod>${now}</lastmod>
          <changefreq>${collection.changefreq}</changefreq>
          <priority>${collection.priority}</priority>
        </url>
      `;
    });
    
    // Agregar páginas estáticas importantes
    const staticPages = [
      { url: '/about', name: 'Acerca de Nosotros', priority: '0.5', changefreq: 'monthly', lastmod: lastMonth },
      { url: '/contact', name: 'Contacto', priority: '0.5', changefreq: 'monthly', lastmod: lastMonth },
      { url: '/shipping', name: 'Envíos', priority: '0.6', changefreq: 'monthly', lastmod: lastMonth },
      { url: '/returns', name: 'Devoluciones', priority: '0.6', changefreq: 'monthly', lastmod: lastMonth },
      { url: '/terms', name: 'Términos y Condiciones', priority: '0.4', changefreq: 'monthly', lastmod: lastMonth },
      { url: '/privacy', name: 'Política de Privacidad', priority: '0.4', changefreq: 'monthly', lastmod: lastMonth },
      { url: '/faq', name: 'Preguntas Frecuentes', priority: '0.5', changefreq: 'monthly', lastmod: lastMonth },
      { url: '/blog', name: 'Blog', priority: '0.6', changefreq: 'weekly', lastmod: now },
      { url: '/store-locations', name: 'Nuestras Tiendas', priority: '0.5', changefreq: 'monthly', lastmod: lastMonth }
    ];
    
    staticPages.forEach(page => {
      xml += `
        <url>
          <loc>${baseUrl}${page.url}</loc>
          <lastmod>${page.lastmod}</lastmod>
          <changefreq>${page.changefreq}</changefreq>
          <priority>${page.priority}</priority>
        </url>
      `;
    });
    
    // Cerrar el XML
    xml += '</urlset>';
    
    // Enviar la respuesta con los headers adecuados
    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=86400'); // Cache por 24 horas
    res.send(xml);
    
    logger.info('Sitemap generado exitosamente');
  } catch (error) {
    logger.error('Error al generar sitemap.xml', { error: error.message, stack: error.stack });
    res.status(500).send('Error al generar sitemap.xml');
  }
};

/**
 * Función auxiliar para escapar caracteres especiales en XML
 * @param {string} text - Texto a escapar
 * @returns {string} - Texto escapado
 */
function escapeXml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

module.exports = {
  getRobotsTxt,
  getSitemap
}; 