
const request = require('supertest');
const app = require('../app');

describe('GET /categories', () => {
  it('debería devolver un array de categorías', async () => {
    const response = await request(app).get('/categories');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});


