/**
 * Script para corregir restricciones UNIQUE en tipo que están causando problemas
 * Este script elimina las restricciones UNIQUE incorrectas y las recrea correctamente
 * Ejecutar con: node src/scripts/fix_type_unique_constraints.js
 */

const sequelize = require('../configs/database');
const logger = require('../configs/logger');

async function fixUniqueConstraints() {
    const transaction = await sequelize.transaction();
    
    try {
        logger.info('Iniciando corrección de restricciones UNIQUE en la tabla Products');
        
        // Verificar si la columna SKU existe en Products
        const [checkSkuColumn] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'Products' AND column_name = 'sku'
        `, { transaction });
        
        if (checkSkuColumn.length > 0) {
            logger.info('Eliminando restricción UNIQUE existente en SKU si existe');
            
            // Eliminar índice único existente si lo hay (no fallará si no existe)
            await sequelize.query(`
                DO $$
                BEGIN
                    BEGIN
                        DROP INDEX IF EXISTS "product_sku_unique";
                    EXCEPTION WHEN OTHERS THEN
                        -- Ignore
                    END;
                END $$;
            `, { transaction });
            
            // Crear un nuevo índice UNIQUE correctamente
            await sequelize.query(`
                CREATE UNIQUE INDEX IF NOT EXISTS "product_sku_unique" ON "Products" ("sku")
                WHERE "sku" IS NOT NULL;
            `, { transaction });
            
            logger.info('Índice UNIQUE en SKU recreado correctamente');
        }
        
        await transaction.commit();
        logger.info('Corrección de restricciones UNIQUE completada exitosamente');
    } catch (error) {
        await transaction.rollback();
        logger.error('Error durante la corrección:', error);
        throw error;
    }
}

// Ejecutar la corrección
fixUniqueConstraints()
    .then(() => {
        logger.info('Proceso de corrección finalizado');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('Error en el proceso de corrección:', error);
        process.exit(1);
    }); 