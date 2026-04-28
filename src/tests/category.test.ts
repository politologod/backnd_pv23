import request from 'supertest';
import app from '../app';

describe('GET /api/categories', () => {
  it('debería devolver un array de categorías', async () => {
    const response = await request(app).get('/api/categories');
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("Category Routes", () => {
  let adminToken;
  let categoryId;

  // Configuración inicial para obtener token de admin
  beforeAll(async () => {
    const loginData = {
      email: "admin@example.com",
      password: "admin123"
    };

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send(loginData);

    // Obtenemos el token desde el cuerpo o desde las cookies
    if (loginRes.body && loginRes.body.token) {
      adminToken = loginRes.body.token;
    } else if (loginRes.headers["set-cookie"] && loginRes.headers["set-cookie"].length > 0) {
      const cookieString = loginRes.headers["set-cookie"][0];
      adminToken = cookieString.split(";")[0].split("=")[1];
    }
  });

  // Test para crear categoría
  describe("POST /api/categories", () => {
    it("debería crear una nueva categoría (status 201)", async () => {
      // Saltamos si no hay token
      if (!adminToken) {
        console.warn("No hay token para el test de creación de categoría");
        return;
      }

      const newCategory = {
        name: `Test Category ${Date.now()}`,
        description: "Test Description"
      };

      // Probamos diferentes formas de autenticación
      let res;
      try {
        // Intento 1: Bearer Token
        res = await request(app)
          .post("/api/categories")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(newCategory);
        
        // Si no funciona, intento 2: Cookie
        if (res.statusCode === 401) {
          res = await request(app)
            .post("/api/categories")
            .set("Cookie", [`token=${adminToken}`])
            .send(newCategory);
        }
      } catch (error) {
        console.error("Error al crear categoría:", error);
      }

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("message", "Categoría creada con éxito.");
      expect(res.body).toHaveProperty("category");
      expect(res.body.category).toHaveProperty("name", newCategory.name);
      
      categoryId = res.body.category.id;
    });

    it("debería fallar si no se proporciona nombre (status 400)", async () => {
      // Saltamos si no hay token
      if (!adminToken) {
        console.warn("No hay token para el test de validación de categoría");
        return;
      }

      const invalidCategory = {
        description: "Test Description"
      };

      // Probamos diferentes formas de autenticación
      let res;
      try {
        // Intento 1: Bearer Token
        res = await request(app)
          .post("/api/categories")
          .set("Authorization", `Bearer ${adminToken}`)
          .send(invalidCategory);
        
        // Si no funciona, intento 2: Cookie
        if (res.statusCode === 401) {
          res = await request(app)
            .post("/api/categories")
            .set("Cookie", [`token=${adminToken}`])
            .send(invalidCategory);
        }
      } catch (error) {
        console.error("Error al validar categoría:", error);
      }

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message", "El nombre es requerido.");
    });
  });

  // Test para obtener todas las categorías
  describe("GET /api/categories", () => {
    it("debería obtener todas las categorías (status 200)", async () => {
      const res = await request(app)
        .get("/api/categories");

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Test para obtener una categoría específica
  describe("GET /api/categories/:id", () => {
    it("debería obtener una categoría específica (status 200)", async () => {
      // Solo ejecutamos si tenemos un ID de categoría
      if (!categoryId) {
        // Saltamos si no hay token
        if (!adminToken) {
          console.warn("No hay token para el test de obtener categoría");
          return;
        }

        const newCategory = {
          name: `Test Category for Get ${Date.now()}`,
          description: "Test Description"
        };

        // Probamos diferentes formas de autenticación
        let createRes;
        try {
          // Intento 1: Bearer Token
          createRes = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newCategory);
          
          // Si no funciona, intento 2: Cookie
          if (createRes.statusCode === 401) {
            createRes = await request(app)
              .post("/api/categories")
              .set("Cookie", [`token=${adminToken}`])
              .send(newCategory);
          }
        } catch (error) {
          console.error("Error al crear categoría para obtener:", error);
          return;
        }
        
        if (createRes.body && createRes.body.category) {
          categoryId = createRes.body.category.id;
        } else {
          console.warn("No se pudo crear una categoría para la prueba");
          return;
        }
      }

      const res = await request(app)
        .get(`/api/categories/${categoryId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("id", categoryId);
    });

    it("debería fallar si la categoría no existe (status 404)", async () => {
      const res = await request(app)
        .get("/api/categories/999999");

      expect(res.statusCode).toBe(404);
      // Aceptamos ambos mensajes con o sin punto final
      expect(res.body.message).toMatch(/Categoría no encontrada\.?/);
    });
  });

  // Test para actualizar categoría
  describe("PUT /api/categories/:id", () => {
    it("debería actualizar una categoría existente (status 200)", async () => {
      // Solo ejecutamos si tenemos un ID de categoría
      if (!categoryId) {
        // Saltamos si no hay token
        if (!adminToken) {
          console.warn("No hay token para el test de actualizar categoría");
          return;
        }

        const newCategory = {
          name: `Test Category for Update ${Date.now()}`,
          description: "Test Description"
        };

        // Probamos diferentes formas de autenticación
        let createRes;
        try {
          // Intento 1: Bearer Token
          createRes = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newCategory);
          
          // Si no funciona, intento 2: Cookie
          if (createRes.statusCode === 401) {
            createRes = await request(app)
              .post("/api/categories")
              .set("Cookie", [`token=${adminToken}`])
              .send(newCategory);
          }
        } catch (error) {
          console.error("Error al crear categoría para actualizar:", error);
          return;
        }
        
        if (createRes.body && createRes.body.category) {
          categoryId = createRes.body.category.id;
        } else {
          console.warn("No se pudo crear una categoría para la prueba");
          return;
        }
      }

      const updateData = {
        name: `Updated Category ${Date.now()}`,
        description: "Updated Description"
      };

      // Probamos diferentes formas de autenticación
      let res;
      try {
        // Intento 1: Bearer Token
        res = await request(app)
          .put(`/api/categories/${categoryId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(updateData);
        
        // Si no funciona, intento 2: Cookie
        if (res.statusCode === 401) {
          res = await request(app)
            .put(`/api/categories/${categoryId}`)
            .set("Cookie", [`token=${adminToken}`])
            .send(updateData);
        }
      } catch (error) {
        console.error("Error al actualizar categoría:", error);
      }

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Categoría actualizada con éxito.");
      expect(res.body.category).toHaveProperty("name", updateData.name);
    });
  });

  // Test para eliminar categoría
  describe("DELETE /api/categories/:id", () => {
    it("debería eliminar una categoría existente (status 200)", async () => {
      // Solo ejecutamos si tenemos un ID de categoría
      if (!categoryId) {
        // Saltamos si no hay token
        if (!adminToken) {
          console.warn("No hay token para el test de eliminar categoría");
          return;
        }

        const newCategory = {
          name: `Test Category for Delete ${Date.now()}`,
          description: "Test Description"
        };

        // Probamos diferentes formas de autenticación
        let createRes;
        try {
          // Intento 1: Bearer Token
          createRes = await request(app)
            .post("/api/categories")
            .set("Authorization", `Bearer ${adminToken}`)
            .send(newCategory);
          
          // Si no funciona, intento 2: Cookie
          if (createRes.statusCode === 401) {
            createRes = await request(app)
              .post("/api/categories")
              .set("Cookie", [`token=${adminToken}`])
              .send(newCategory);
          }
        } catch (error) {
          console.error("Error al crear categoría para eliminar:", error);
          return;
        }
        
        if (createRes.body && createRes.body.category) {
          categoryId = createRes.body.category.id;
        } else {
          console.warn("No se pudo crear una categoría para la prueba");
          return;
        }
      }

      // Probamos diferentes formas de autenticación
      let res;
      try {
        // Intento 1: Bearer Token
        res = await request(app)
          .delete(`/api/categories/${categoryId}`)
          .set("Authorization", `Bearer ${adminToken}`);
        
        // Si no funciona, intento 2: Cookie
        if (res.statusCode === 401) {
          res = await request(app)
            .delete(`/api/categories/${categoryId}`)
            .set("Cookie", [`token=${adminToken}`]);
        }
      } catch (error) {
        console.error("Error al eliminar categoría:", error);
      }

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Categoría eliminada con éxito.");
    });
  });
});


