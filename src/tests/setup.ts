import { beforeAll, afterAll } from '@jest/globals';
import sequelize from '../configs/database';

beforeAll(async () => {
  try {
    // Sincronizar todos los modelos forzando la recreación de las tablas
    // Esto asegura que cada corrida de pruebas empiece con una base de datos limpia
    await sequelize.sync({ force: true });
    console.log('Database synced for testing');
  } catch (error) {
    console.error('Error syncing database:', error);
  }
});

afterAll(async () => {
  try {
    // Cerrar la conexión después de correr los tests
    await sequelize.close();
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
});
