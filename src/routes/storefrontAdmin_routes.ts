// @ts-nocheck
import { Router } from 'express';
import { checkRole } from '../middlewares/auth';
import * as adminController from '../controllers/storefrontAdmin_controller';
import * as bannerMediaController from '../controllers/bannerMedia_controller';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Multer config for storefront uploads
const uploadDir = path.join(__dirname, '../../uploads/storefront');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg|mp4|webm/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Solo se permiten imágenes y videos'));
  },
});

// ===================== THEME =====================

/**
 * @swagger
 * /api/admin/storefront/theme:
 *   get:
 *     summary: Obtener tema activo
 *     tags: [Admin Storefront]
 */
router.get('/theme', checkRole(['admin', 'staff']), adminController.getTheme);

/**
 * @swagger
 * /api/admin/storefront/theme:
 *   put:
 *     summary: Actualizar tema (guarda como borrador)
 *     tags: [Admin Storefront]
 */
router.put('/theme', checkRole(['admin']), adminController.updateTheme);

/**
 * @swagger
 * /api/admin/storefront/theme/publish:
 *   post:
 *     summary: Publicar tema
 *     tags: [Admin Storefront]
 */
router.post('/theme/publish', checkRole(['admin']), adminController.publishTheme);

// ===================== PAGES =====================

/**
 * @swagger
 * /api/admin/storefront/pages:
 *   get:
 *     summary: Listar todas las páginas (incluye borradores)
 *     tags: [Admin Storefront]
 */
router.get('/pages', checkRole(['admin', 'staff']), adminController.getAllPages);

router.get('/pages/:id', checkRole(['admin', 'staff']), adminController.getPageById);
router.post('/pages', checkRole(['admin']), adminController.createPage);
router.put('/pages/:id', checkRole(['admin']), adminController.updatePage);
router.delete('/pages/:id', checkRole(['admin']), adminController.deletePage);

// ===================== SECTIONS =====================

router.get('/pages/:pageId/sections', checkRole(['admin', 'staff']), adminController.getPageSections);
router.post('/pages/:pageId/sections', checkRole(['admin']), adminController.createSection);
router.put('/sections/:id', checkRole(['admin']), adminController.updateSection);
router.delete('/sections/:id', checkRole(['admin']), adminController.deleteSection);
router.put('/pages/:pageId/sections/reorder', checkRole(['admin']), adminController.reorderSections);

// ===================== NAVIGATION =====================

router.put('/navigation', checkRole(['admin']), adminController.updateNavigation);

// ===================== BANNERS =====================

router.get('/banners', checkRole(['admin', 'staff']), bannerMediaController.getAllBanners);
router.post('/banners', checkRole(['admin']), upload.single('image'), bannerMediaController.createBanner);
router.put('/banners/:id', checkRole(['admin']), upload.single('image'), bannerMediaController.updateBanner);
router.delete('/banners/:id', checkRole(['admin']), bannerMediaController.deleteBanner);

// ===================== MEDIA LIBRARY =====================

router.get('/media', checkRole(['admin', 'staff']), bannerMediaController.getAllMedia);
router.post('/media/upload', checkRole(['admin', 'staff']), upload.array('files', 10), bannerMediaController.uploadMedia);
router.put('/media/:id', checkRole(['admin']), bannerMediaController.updateMedia);
router.delete('/media/:id', checkRole(['admin']), bannerMediaController.deleteMedia);

export default router;
