import request from 'supertest';
import app from '../app';
import sequelize from '../configs/database';

describe('Health Check Endpoints', () => {
  // Test para el endpoint de salud general
  describe('GET /api/health', () => {
    it('debería devolver estado 200 y la información de salud completa', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect('Content-Type', /json/)
        .expect(200);

      // Verificar la estructura de la respuesta
      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('dependencies');
      expect(response.body.service).toHaveProperty('status');
      expect(response.body.service).toHaveProperty('uptime');
      expect(response.body.service).toHaveProperty('version');
    });
  });

  // Test para el endpoint de liveness
  describe('GET /api/health/liveness', () => {
    it('debería devolver estado 200 y confirmar que el servicio está vivo', async () => {
      const response = await request(app)
        .get('/api/health/liveness')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  // Test para el endpoint de readiness
  describe('GET /api/health/readiness', () => {
    it('debería devolver estado 200 si la base de datos está disponible', async () => {
      // Mock de sequelize.authenticate para simular conexión exitosa
      const originalAuthenticate = sequelize.authenticate;
      sequelize.authenticate = jest.fn().mockResolvedValue();

      const response = await request(app)
        .get('/api/health/readiness')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('database', 'ok');

      // Restaurar el método original
      sequelize.authenticate = originalAuthenticate;
    });

    it('debería devolver estado 503 si la base de datos no está disponible', async () => {
      // Mock de sequelize.authenticate para simular fallo de conexión
      const originalAuthenticate = sequelize.authenticate;
      sequelize.authenticate = jest.fn().mockRejectedValue(new Error('DB Connection Error'));

      const response = await request(app)
        .get('/api/health/readiness')
        .expect('Content-Type', /json/)
        .expect(503);

      expect(response.body).toHaveProperty('status', 'error');
      expect(response.body).toHaveProperty('database', 'error');

      // Restaurar el método original
      sequelize.authenticate = originalAuthenticate;
    });
  });

  // Test para el endpoint de métricas
  describe('GET /api/health/metrics', () => {
    it('debería devolver estado 200 y la información de métricas', async () => {
      const response = await request(app)
        .get('/api/health/metrics')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('process');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.process).toHaveProperty('memory');
      expect(response.body.process).toHaveProperty('uptime');
      expect(response.body.system).toHaveProperty('loadAverage');
      expect(response.body.system).toHaveProperty('freeMemory');
    });
  });
}); 