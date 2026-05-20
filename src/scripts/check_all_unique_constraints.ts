/**
 * Script para examinar todas las restricciones UNIQUE en la base de datos
 * Ejecutar con: node src/scripts/check_all_unique_constraints.js
 */

import sequelize from '../configs/database';
import logger from '../configs/logger';

async function checkUniqueConstraints() {
    try {
        // Conectar a la base de datos
        await sequelize.authenticate();
        logger.info('Conexión establecida correctamente');
        
        // 1. Obtener todas las tablas de la base de datos
        const [tables] = await sequelize.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        `);
        
        logger.info(`Tablas encontradas: ${tables.length}`);
        
        for (const table of tables) {
        const tableName = (table as any).table_name;
            logger.info(`Examinando tabla: ${tableName}`);
            
            // 2. Obtener todas las columnas de la tabla
            const [columns] = await sequelize.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = '${tableName}'
            `);
            
            logger.info(`Columnas en ${tableName}: ${columns.length}`);
            
            // 3. Obtener restricciones únicas
            const [uniqueConstraints] = await sequelize.query(`
                SELECT tc.constraint_name, kcu.column_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_catalog = kcu.constraint_catalog
                    AND tc.constraint_schema = kcu.constraint_schema
                    AND tc.constraint_name = kcu.constraint_name
                WHERE tc.constraint_type = 'UNIQUE'
                    AND tc.table_name = '${tableName}'
            `);
            
            if (uniqueConstraints.length > 0) {
                logger.info(`Restricciones UNIQUE en ${tableName}:`);
                uniqueConstraints.forEach((constraint: any) => {
                    logger.info(`  - ${constraint.constraint_name} en columna ${constraint.column_name}`);
                });
            } else {
                logger.info(`No se encontraron restricciones UNIQUE en ${tableName}`);
            }
            
            // 4. Obtener índices únicos
            const [uniqueIndices] = await sequelize.query(`
                SELECT indexname, indexdef
                FROM pg_indexes
                WHERE tablename = '${tableName}'
                AND indexdef LIKE '%UNIQUE%'
            `);
            
            if (uniqueIndices.length > 0) {
                logger.info(`Índices UNIQUE en ${tableName}:`);
                uniqueIndices.forEach((index: any) => {
                    logger.info(`  - ${index.indexname}: ${index.indexdef}`);
                });
            } else {
                logger.info(`No se encontraron índices UNIQUE en ${tableName}`);
            }
        }
        
        logger.info('Revisión de restricciones completada');
    } catch (error) {
        logger.error('Error durante la revisión:', error);
    } finally {
        // Cerrar la conexión
        await sequelize.close();
    }
}

// Ejecutar la revisión
checkUniqueConstraints()
    .then(() => {
        logger.info('Proceso finalizado');
        process.exit(0);
    })
    .catch((error) => {
        logger.error('Error en el proceso:', error);
        process.exit(1);
    }); 