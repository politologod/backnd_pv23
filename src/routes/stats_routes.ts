import express from 'express';
const router = express.Router();
import { auth, checkRole } from '../middlewares/auth';
import * as adminController from '../controllers/admin_controller';

/**
 * Route aliases para que el frontend pueda consumir estadísticas
 * desde /api/stats/* y /api/dashboard/* en lugar de /api/admin/stats/*
 * 
 * Estos aliases permiten compatibilidad con el contrato del frontend.
 */

// === Dashboard Stats (alias de /api/admin/stats/dashboard) ===
router.get('/dashboard/stats', auth, checkRole(["admin"]), adminController.getDashboardStats);

// === General Stats (alias de /api/admin/stats) ===
router.get('/stats/general', auth, checkRole(["admin"]), adminController.getGeneralStats);

// === Sales by Category (alias de /api/admin/stats/category) ===
router.get('/stats/sales-by-category', auth, checkRole(["admin"]), adminController.getSalesByCategory);

// === Orders by Month (alias de /api/admin/stats/orders) ===
router.get('/stats/orders-by-month', auth, checkRole(["admin"]), adminController.getOrdersByMonth);

// === Customers by Month (alias de /api/admin/stats/customers) ===
router.get('/stats/customers-by-month', auth, checkRole(["admin"]), adminController.getCustomersByMonth);

// === Sales by Month (alias de /api/admin/stats/sales) ===
router.get('/stats/sales-by-month', auth, checkRole(["admin"]), adminController.getSalesByMonth);

export default router;
