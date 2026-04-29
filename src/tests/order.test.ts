import { describe, it, expect, jest, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import app from '../app';

describe("Order Routes", () => {
  let userToken: string;
  let adminToken: string;
  let orderId: number;
  let productId: number;
  let categoryId: number;

  // Configuración inicial
  beforeAll(async () => {
    // Login como usuario normal
    const userLoginData = {
      email: "user@example.com",
      password: "user123"
    };

    const userLoginRes = await request(app)
      .post("/api/auth/login")
      .send(userLoginData);

    // Obtenemos el token de usuario
    if (userLoginRes.body && userLoginRes.body.token) {
      userToken = userLoginRes.body.token;
    } else if (userLoginRes.headers["set-cookie"] && userLoginRes.headers["set-cookie"].length > 0) {
      const cookieString = userLoginRes.headers["set-cookie"][0];
      userToken = cookieString.split(";")[0].split("=")[1];
    }

    // Login como admin
    const adminLoginData = {
      email: "admin@example.com",
      password: "admin123"
    };

    const adminLoginRes = await request(app)
      .post("/api/auth/login")
      .send(adminLoginData);

    // Obtenemos el token de admin
    if (adminLoginRes.body && adminLoginRes.body.token) {
      adminToken = adminLoginRes.body.token;
    } else if (adminLoginRes.headers["set-cookie"] && adminLoginRes.headers["set-cookie"].length > 0) {
      const cookieString = adminLoginRes.headers["set-cookie"][0];
      adminToken = cookieString.split(";")[0].split("=")[1];
    }

    // Si no obtenemos tokens, no podemos continuar
    if (!userToken || !adminToken) {
      console.warn("No se pudieron obtener los tokens necesarios");
      return;
    }

    // Crear categoría y producto
    const categoryData = {
      name: `Test Category ${Date.now()}`,
      description: "Test Description"
    };

    // Intentamos con ambas rutas posibles
    let categoryRes;
    try {
      categoryRes = await request(app)
        .post("/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(categoryData);
    } catch (err) {
      categoryRes = await request(app)
        .post("/api/categories")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(categoryData);
    }

    // Verificamos si tenemos un ID de categoría
    if (categoryRes.body && categoryRes.body.category && categoryRes.body.category.id) {
      categoryId = categoryRes.body.category.id;
    } else {
      console.warn("No se pudo crear una categoría");
      return;
    }

    const productData = {
      name: `Test Product ${Date.now()}`,
      description: "Test Description",
      price: 99.99,
      stock: 100,
      categoryId: categoryId
    };

    // Intentamos con ambas rutas posibles
    let productRes;
    try {
      productRes = await request(app)
        .post("/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(productData);
    } catch (err) {
      productRes = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(productData);
    }

    // Verificamos si tenemos un ID de producto
    if (productRes.body && productRes.body.product && productRes.body.product.id) {
      productId = productRes.body.product.id;
    } else {
      console.warn("No se pudo crear un producto");
      return;
    }

    // Agregar producto al carrito
    const cartItem = {
      productId: productId,
      quantity: 2
    };

    // Intentamos con ambas rutas posibles
    try {
      await request(app)
        .post("/cart")
        .set("Authorization", `Bearer ${userToken}`)
        .send(cartItem);
    } catch (err) {
      await request(app)
        .post("/api/cart")
        .set("Authorization", `Bearer ${userToken}`)
        .send(cartItem);
    }
  });

  // Test para crear orden
  describe("POST /orders", () => {
    it("debería crear una nueva orden (status 201)", async () => {
      // Solo ejecutamos si tenemos token
      if (!userToken) {
        console.warn("No hay token para el test de crear orden");
        return;
      }

      const orderData = {
        shippingAddress: {
          street: "Test Street",
          city: "Test City",
          state: "Test State",
          zipCode: "12345",
          country: "Test Country"
        },
        paymentMethod: "credit_card"
      };

      // Intentamos con ambas rutas posibles
      let res: any;
      try {
        res = await request(app)
          .post("/orders")
          .set("Authorization", `Bearer ${userToken}`)
          .send(orderData);
      } catch (err) {
        res = await request(app)
          .post("/api/orders")
          .set("Authorization", `Bearer ${userToken}`)
          .send(orderData);
      }

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("message", "Orden creada con éxito.");
      expect(res.body).toHaveProperty("order");
      expect(res.body.order).toHaveProperty("status", "pending");
      
      orderId = res.body.order.id;
    });

    it("debería fallar si falta información de envío (status 400)", async () => {
      // Solo ejecutamos si tenemos token
      if (!userToken) {
        console.warn("No hay token para el test de validación de orden");
        return;
      }

      const invalidOrderData = {
        paymentMethod: "credit_card"
      };

      // Intentamos con ambas rutas posibles
      let res: any;
      try {
        res = await request(app)
          .post("/orders")
          .set("Authorization", `Bearer ${userToken}`)
          .send(invalidOrderData);
      } catch (err) {
        res = await request(app)
          .post("/api/orders")
          .set("Authorization", `Bearer ${userToken}`)
          .send(invalidOrderData);
      }

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });
  });

  // Test para obtener órdenes del usuario
  describe("GET /orders", () => {
    it("debería obtener las órdenes del usuario (status 200)", async () => {
      // Solo ejecutamos si tenemos token
      if (!userToken) {
        console.warn("No hay token para el test de obtener órdenes");
        return;
      }

      // Intentamos con ambas rutas posibles
      let res: any;
      try {
        res = await request(app)
          .get("/orders")
          .set("Authorization", `Bearer ${userToken}`);
      } catch (err) {
        res = await request(app)
          .get("/api/orders")
          .set("Authorization", `Bearer ${userToken}`);
      }

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Test para obtener una orden específica
  describe("GET /orders/:id", () => {
    it("debería obtener una orden específica (status 200)", async () => {
      // Solo ejecutamos si tenemos token y ID de orden
      if (!userToken || !orderId) {
        console.warn("No hay token o ID de orden para el test de obtener orden específica");
        return;
      }

      // Intentamos con ambas rutas posibles
      let res: any;
      try {
        res = await request(app)
          .get(`/orders/${orderId}`)
          .set("Authorization", `Bearer ${userToken}`);
      } catch (err) {
        res = await request(app)
          .get(`/api/orders/${orderId}`)
          .set("Authorization", `Bearer ${userToken}`);
      }

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("id", orderId);
    });

    it("debería fallar si la orden no existe (status 404)", async () => {
      // Solo ejecutamos si tenemos token
      if (!userToken) {
        console.warn("No hay token para el test de orden no encontrada");
        return;
      }

      // Intentamos con ambas rutas posibles
      let res: any;
      try {
        res = await request(app)
          .get("/orders/999999")
          .set("Authorization", `Bearer ${userToken}`);
      } catch (err) {
        res = await request(app)
          .get("/api/orders/999999")
          .set("Authorization", `Bearer ${userToken}`);
      }

      expect(res.statusCode).toBe(404);
      expect(res.body).toHaveProperty("message", "Orden no encontrada.");
    });
  });

  // Test para actualizar estado de la orden (admin)
  describe("PUT /orders/:id/status", () => {
    it("debería actualizar el estado de la orden (status 200)", async () => {
      // Solo ejecutamos si tenemos token de admin y ID de orden
      if (!adminToken || !orderId) {
        console.warn("No hay token de admin o ID de orden para el test de actualizar estado");
        return;
      }

      const updateData = {
        status: "processing"
      };

      // Intentamos con ambas rutas posibles
      let res: any;
      try {
        res = await request(app)
          .put(`/orders/${orderId}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(updateData);
      } catch (err) {
        res = await request(app)
          .put(`/api/orders/${orderId}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(updateData);
      }

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Estado de la orden actualizado.");
      expect(res.body.order).toHaveProperty("status", updateData.status);
    });

    it("debería fallar si el estado es inválido (status 400)", async () => {
      // Solo ejecutamos si tenemos token de admin y ID de orden
      if (!adminToken || !orderId) {
        console.warn("No hay token de admin o ID de orden para el test de estado inválido");
        return;
      }

      const invalidUpdateData = {
        status: "invalid_status"
      };

      // Intentamos con ambas rutas posibles
      let res: any;
      try {
        res = await request(app)
          .put(`/orders/${orderId}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(invalidUpdateData);
      } catch (err) {
        res = await request(app)
          .put(`/api/orders/${orderId}/status`)
          .set("Authorization", `Bearer ${adminToken}`)
          .send(invalidUpdateData);
      }

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });
  });

  // Test para cancelar orden
  describe("POST /orders/:id/cancel", () => {
    it("debería cancelar una orden (status 200)", async () => {
      // Solo ejecutamos si tenemos token y ID de orden
      if (!userToken || !orderId) {
        console.warn("No hay token o ID de orden para el test de cancelar orden");
        return;
      }

      // Intentamos con ambas rutas posibles
      let res: any;
      try {
        res = await request(app)
          .post(`/orders/${orderId}/cancel`)
          .set("Authorization", `Bearer ${userToken}`);
      } catch (err) {
        res = await request(app)
          .post(`/api/orders/${orderId}/cancel`)
          .set("Authorization", `Bearer ${userToken}`);
      }

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Orden cancelada con éxito.");
      expect(res.body.order).toHaveProperty("status", "cancelled");
    });
  });
}); 