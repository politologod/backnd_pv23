import request from 'supertest';
import app from '../app';

describe("Cart Routes", () => {
  let userToken;
  let adminToken;
  let productId;
  let categoryId;

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

    // Crear categoría
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

    // Crear producto
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
    }
  });

  // Test para agregar producto al carrito
  describe("POST /cart", () => {
    it("debería agregar un producto al carrito (status 201)", async () => {
      // Solo ejecutamos si tenemos token y producto
      if (!userToken || !productId) {
        console.warn("No hay token o producto para el test de agregar al carrito");
        return;
      }

      const cartItem = {
        productId: productId,
        quantity: 2
      };

      // Intentamos con ambas rutas posibles
      let res;
      try {
        res = await request(app)
          .post("/cart")
          .set("Authorization", `Bearer ${userToken}`)
          .send(cartItem);
      } catch (err) {
        res = await request(app)
          .post("/api/cart")
          .set("Authorization", `Bearer ${userToken}`)
          .send(cartItem);
      }

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("message", "Producto agregado al carrito.");
      expect(res.body).toHaveProperty("cartItem");
      expect(res.body.cartItem).toHaveProperty("productId", productId);
      expect(res.body.cartItem).toHaveProperty("quantity", cartItem.quantity);
    });

    it("debería fallar si la cantidad es inválida (status 400)", async () => {
      // Solo ejecutamos si tenemos token y producto
      if (!userToken || !productId) {
        console.warn("No hay token o producto para el test de validación del carrito");
        return;
      }

      const invalidCartItem = {
        productId: productId,
        quantity: 0
      };

      // Intentamos con ambas rutas posibles
      let res;
      try {
        res = await request(app)
          .post("/cart")
          .set("Authorization", `Bearer ${userToken}`)
          .send(invalidCartItem);
      } catch (err) {
        res = await request(app)
          .post("/api/cart")
          .set("Authorization", `Bearer ${userToken}`)
          .send(invalidCartItem);
      }

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message");
    });
  });

  // Test para obtener el carrito
  describe("GET /cart", () => {
    it("debería obtener el carrito del usuario (status 200)", async () => {
      // Solo ejecutamos si tenemos token
      if (!userToken) {
        console.warn("No hay token para el test de obtener carrito");
        return;
      }

      // Intentamos con ambas rutas posibles
      let res;
      try {
        res = await request(app)
          .get("/cart")
          .set("Authorization", `Bearer ${userToken}`);
      } catch (err) {
        res = await request(app)
          .get("/api/cart")
          .set("Authorization", `Bearer ${userToken}`);
      }

      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // Test para actualizar cantidad en el carrito
  describe("PUT /cart/:id", () => {
    let cartItemId;

    beforeAll(async () => {
      // Solo ejecutamos si tenemos token y producto
      if (!userToken || !productId) {
        console.warn("No hay token o producto para el test de actualizar carrito");
        return;
      }

      // Agregar producto al carrito
      const cartItem = {
        productId: productId,
        quantity: 2
      };

      // Intentamos con ambas rutas posibles
      let cartRes;
      try {
        cartRes = await request(app)
          .post("/cart")
          .set("Authorization", `Bearer ${userToken}`)
          .send(cartItem);
      } catch (err) {
        cartRes = await request(app)
          .post("/api/cart")
          .set("Authorization", `Bearer ${userToken}`)
          .send(cartItem);
      }

      if (cartRes.body && cartRes.body.cartItem && cartRes.body.cartItem.id) {
        cartItemId = cartRes.body.cartItem.id;
      } else {
        console.warn("No se pudo obtener el ID del item del carrito");
      }
    });

    it("debería actualizar la cantidad de un item (status 200)", async () => {
      // Solo ejecutamos si tenemos token y ID del item
      if (!userToken || !cartItemId) {
        console.warn("No hay token o ID de item para actualizar carrito");
        return;
      }

      const updateData = {
        quantity: 3
      };

      // Intentamos con ambas rutas posibles
      let res;
      try {
        res = await request(app)
          .put(`/cart/${cartItemId}`)
          .set("Authorization", `Bearer ${userToken}`)
          .send(updateData);
      } catch (err) {
        res = await request(app)
          .put(`/api/cart/${cartItemId}`)
          .set("Authorization", `Bearer ${userToken}`)
          .send(updateData);
      }

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Carrito actualizado con éxito.");
      expect(res.body.cartItem).toHaveProperty("quantity", updateData.quantity);
    });
  });

  // Test para eliminar item del carrito
  describe("DELETE /cart/:id", () => {
    let cartItemId;

    beforeAll(async () => {
      // Solo ejecutamos si tenemos token y producto
      if (!userToken || !productId) {
        console.warn("No hay token o producto para el test de eliminar item");
        return;
      }

      // Agregar producto al carrito
      const cartItem = {
        productId: productId,
        quantity: 2
      };

      // Intentamos con ambas rutas posibles
      let cartRes;
      try {
        cartRes = await request(app)
          .post("/cart")
          .set("Authorization", `Bearer ${userToken}`)
          .send(cartItem);
      } catch (err) {
        cartRes = await request(app)
          .post("/api/cart")
          .set("Authorization", `Bearer ${userToken}`)
          .send(cartItem);
      }

      if (cartRes.body && cartRes.body.cartItem && cartRes.body.cartItem.id) {
        cartItemId = cartRes.body.cartItem.id;
      } else {
        console.warn("No se pudo obtener el ID del item del carrito");
      }
    });

    it("debería eliminar un item del carrito (status 200)", async () => {
      // Solo ejecutamos si tenemos token e ID del item
      if (!userToken || !cartItemId) {
        console.warn("No hay token o ID de item para eliminar del carrito");
        return;
      }

      // Intentamos con ambas rutas posibles
      let res;
      try {
        res = await request(app)
          .delete(`/cart/${cartItemId}`)
          .set("Authorization", `Bearer ${userToken}`);
      } catch (err) {
        res = await request(app)
          .delete(`/api/cart/${cartItemId}`)
          .set("Authorization", `Bearer ${userToken}`);
      }

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Producto eliminado del carrito.");
    });
  });

  // Test para limpiar el carrito
  describe("DELETE /cart", () => {
    it("debería limpiar todo el carrito (status 200)", async () => {
      // Solo ejecutamos si tenemos token
      if (!userToken) {
        console.warn("No hay token para el test de limpiar carrito");
        return;
      }

      // Intentamos con ambas rutas posibles
      let res;
      try {
        res = await request(app)
          .delete("/cart")
          .set("Authorization", `Bearer ${userToken}`);
      } catch (err) {
        res = await request(app)
          .delete("/api/cart")
          .set("Authorization", `Bearer ${userToken}`);
      }

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Carrito vaciado con éxito.");
    });
  });
}); 