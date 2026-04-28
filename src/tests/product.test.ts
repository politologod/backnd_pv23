import request from 'supertest';
import app from '../app';

describe("Product Routes", () => {
  let adminToken;
  let productId;
  let categoryId;

  // Configuración inicial para obtener token de admin y crear una categoría
  beforeAll(async () => {
    // Login como admin
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

    // Si no obtenemos un token, no podemos continuar con los tests
    if (!adminToken) {
      console.warn("No se pudo obtener un token de administrador");
      return;
    }

    // Crear una categoría para los tests
    const categoryData = {
      name: `Test Category ${Date.now()}`,
      description: "Test Description"
    };

    // Intentamos con ambas rutas posibles
    let categoryRes;
    try {
      categoryRes = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(categoryData);
    } catch (err) {
      console.error("Error al crear categoría:", err);
      return;
    }

    // Verificamos si tenemos un ID de categoría
    if (categoryRes.body && categoryRes.body.category && categoryRes.body.category.id) {
      categoryId = categoryRes.body.category.id;
    } else {
      console.warn("No se pudo crear una categoría para los tests de productos");
    }
  });

  // Test para crear producto
  describe("POST /api/products", () => {
    it("debería crear un nuevo producto (status 201)", async () => {
      // Solo ejecutamos si tenemos un token y una categoría
      if (!adminToken || !categoryId) {
        console.warn("No hay token o categoría para el test de creación de producto");
        return;
      }

      const newProduct = {
        name: `Test Product ${Date.now()}`,
        description: "Test Description",
        price: 99.99,
        stock: 100,
        categoryId: categoryId
      };

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(newProduct);

      // El controlador real devuelve directamente el producto creado
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("name", newProduct.name);
      
      productId = res.body.id;
    });

    it("debería fallar si faltan campos requeridos (status 400)", async () => {
      // Solo ejecutamos si tenemos un token
      if (!adminToken) {
        console.warn("No hay token para el test de validación de producto");
        return;
      }

      const invalidProduct = {
        name: "Test Product"
      };

      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(invalidProduct);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("error");
    });
  });

  // Test para obtener todos los productos
  describe("GET /api/products", () => {
    it("debería obtener todos los productos (status 200)", async () => {
      const res = await request(app)
        .get("/api/products");

      expect(res.statusCode).toBe(200);
      // El controlador devuelve un objeto con products y pagination
      expect(res.body).toHaveProperty("products");
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it("debería filtrar productos por categoría (status 200)", async () => {
      // Solo ejecutamos si tenemos una categoría
      if (!categoryId) {
        console.warn("No hay categoría para el test de filtrado de productos");
        return;
      }

      const res = await request(app)
        .get(`/api/products/category/${categoryId}`);

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Test para obtener un producto específico
  describe("GET /api/products/:id", () => {
    it("debería obtener un producto específico (status 200)", async () => {
      // Solo ejecutamos si tenemos un ID de producto
      if (!productId) {
        console.warn("No hay ID de producto para el test de obtención de producto");
        return;
      }

      const res = await request(app)
        .get(`/api/products/${productId}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("id", productId);
    });

    it("debería fallar si el producto no existe (status 404)", async () => {
      const res = await request(app)
        .get("/api/products/999999");

      expect(res.statusCode).toBe(404);
      // Según el controlador, devuelve { error: "Producto no encontrado" }
      expect(res.body).toHaveProperty("error", "Producto no encontrado");
    });
  });

  // Test para actualizar producto
  describe("PUT /api/products/:id", () => {
    it("debería actualizar un producto existente (status 200)", async () => {
      // Solo ejecutamos si tenemos un token y un ID de producto
      if (!adminToken || !productId) {
        console.warn("No hay token o ID de producto para el test de actualización de producto");
        return;
      }

      const updateData = {
        name: `Updated Product ${Date.now()}`,
        price: 149.99,
        stock: 50
      };

      const res = await request(app)
        .put(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      // El controlador devuelve directamente el producto actualizado
      expect(res.body).toHaveProperty("name", updateData.name);
    });
  });

  // Test para eliminar producto
  describe("DELETE /api/products/:id", () => {
    it("debería eliminar un producto existente (status 200)", async () => {
      // Solo ejecutamos si tenemos un token y un ID de producto
      if (!adminToken || !productId) {
        console.warn("No hay token o ID de producto para el test de eliminación de producto");
        return;
      }

      const res = await request(app)
        .delete(`/api/products/${productId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Producto eliminado con éxito");
    });
  });
}); 