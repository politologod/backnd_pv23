/**
 * Script para corregir el modelo de productos y agregar SKU correctamente
 * Ejecutar con: node src/scripts/fix_products_model.js
 */

import sequelize from '../configs/database';
import logger from '../configs/logger';
import path from 'path';

async function fixProductsModel() {
    const transaction = await sequelize.transaction();
    
    try {
        logger.info('Iniciando corrección del modelo de productos');
        
        // 1. Verificar si la columna SKU ya existe
        const [checkSkuColumn] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'Products' AND column_name = 'sku'
        `, { transaction });
        
        if (checkSkuColumn.length === 0) {
            // Si la columna no existe, la creamos
            await sequelize.query(`
                ALTER TABLE "Products" 
                ADD COLUMN "sku" VARCHAR(50)
            `, { transaction });
            
            logger.info('Columna SKU agregada a la tabla Products');
        } else {
            logger.info('La columna SKU ya existe en la tabla Products');
        }
        
        // 2. Obtener todas las restricciones UNIQUE para la columna SKU
        const [uniqueConstraints] = await sequelize.query(`
            SELECT tc.constraint_name
            FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu
                ON tc.constraint_catalog = kcu.constraint_catalog
                AND tc.constraint_schema = kcu.constraint_schema
                AND tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'UNIQUE'
                AND tc.table_name = 'Products'
                AND kcu.column_name = 'sku'
        `, { transaction });
        
        // 3. Eliminar las restricciones UNIQUE existentes para SKU
        for (const constraint of uniqueConstraints) {
            logger.info(`Eliminando restricción: ${constraint.constraint_name}`);
            await sequelize.query(`
                ALTER TABLE "Products" DROP CONSTRAINT "${constraint.constraint_name}"
            `, { transaction });
        }
        
        // 4. Obtener los índices existentes para SKU
        const [skuIndices] = await sequelize.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'Products' AND indexdef LIKE '%sku%'
        `, { transaction });
        
        // 5. Eliminar los índices existentes para SKU
        for (const idx of skuIndices) {
            logger.info(`Eliminando índice: ${idx.indexname}`);
            await sequelize.query(`
                DROP INDEX IF EXISTS "${idx.indexname}"
            `, { transaction });
        }
        
        // 6. Crear un nuevo índice único para SKU
        await sequelize.query(`
            CREATE UNIQUE INDEX "product_sku_unique" ON "Products" ("sku") 
            WHERE "sku" IS NOT NULL
        `, { transaction });
        
        logger.info('Índice único para SKU creado correctamente');
        
        // 7. Agregar comentario a la columna
        await sequelize.query(`
            COMMENT ON COLUMN "Products"."sku" IS 'Código único de producto (Stock Keeping Unit)'
        `, { transaction });
        
        logger.info('Comentario agregado a la columna SKU');
        
        await transaction.commit();
        logger.info('Corrección del modelo de productos completada exitosamente');
    } catch (error) {
        await transaction.rollback();
        logger.error('Error durante la corrección:', error);
        throw error;
    }
}

// Ejecutar la corrección
fixProductsModel()
    .then(() => {
        logger.info('Proceso finalizado');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('Error en el proceso:', error);
        process.exit(1);
    }); 