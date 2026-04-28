/**
 * Script para agregar la columna SKU a la tabla Products
 * Ejecutar con: node src/scripts/add_sku_to_products.js
 */

import sequelize from '../configs/database';
import logger from '../configs/logger';

async function addSkuColumnToProducts() {
    const transaction = await sequelize.transaction();
    
    try {
        logger.info('Iniciando migración: Agregar columna SKU a Products');
        
        // Verificar si la columna ya existe
        const [checkResults] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Products' AND column_name = 'sku'
        `, { transaction });
        
        if (checkResults.length > 0) {
            logger.info('La columna SKU ya existe en la tabla Products');
            await transaction.commit();
            return;
        }
        
        // Agregar la columna SKU
        await sequelize.query(`
            ALTER TABLE "Products" 
            ADD COLUMN "sku" VARCHAR(50) UNIQUE
        `, { transaction });
        
        logger.info('Columna SKU agregada correctamente a la tabla Products');
        
        // Agregar comentario a la columna
        await sequelize.query(`
            COMMENT ON COLUMN "Products"."sku" IS 'Código único de producto (Stock Keeping Unit)'
        `, { transaction });
        
        logger.info('Comentario agregado a la columna SKU');
        
        await transaction.commit();
        logger.info('Migración completada exitosamente');
    } catch (error) {
        await transaction.rollback();
        logger.error('Error durante la migración:', error);
        throw error;
    }
}

// Ejecutar la migración
addSkuColumnToProducts()
    .then(() => {
        logger.info('Proceso de migración finalizado');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('Error en el proceso de migración:', error);
        process.exit(1);
    }); 