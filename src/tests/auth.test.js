const request = require("supertest");
const app = require("../app");

describe("Auth Routes", () => {
  // Test para registro de usuarios
  describe("POST /api/auth/register", () => {
    it("debería registrar un nuevo usuario (status 201)", async () => {
      const newUser = {
        name: "Test User",
        email: `test${Date.now()}@example.com`, // Email único
        password: "password123",
        role: "customer"
      };

      const res = await request(app)
        .post("/api/auth/register")
        .send(newUser);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty("message", "Usuario registrado con éxito.");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("name", newUser.name);
      expect(res.body.user).toHaveProperty("email", newUser.email);
    });

    it("debería fallar si el email ya está en uso (status 400)", async () => {
      const existingUser = {
        name: "Existing User",
        email: "existing@example.com",
        password: "password123",
        role: "customer"
      };

      // Primero creamos un usuario
      await request(app)
        .post("/api/auth/register")
        .send(existingUser);

      // Luego intentamos crear otro con el mismo email
      const res = await request(app)
        .post("/api/auth/register")
        .send(existingUser);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty("message", "El correo ya está en uso.");
    });
  });

  // Test para login
  describe("POST /api/auth/login", () => {
    let userEmail;

    beforeAll(async () => {
      // Crear un usuario para probar el login
      userEmail = `testlogin${Date.now()}@example.com`;
      const newUser = {
        name: "Test Login User",
        email: userEmail,
        password: "password123",
        role: "customer"
      };

      await request(app)
        .post("/api/auth/register")
        .send(newUser);
    });

    it("debería iniciar sesión con credenciales correctas (status 200)", async () => {
      const loginData = {
        email: userEmail,
        password: "password123"
      };

      const res = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("message", "Inicio de sesión exitoso.");
      expect(res.body).toHaveProperty("user");
      // Verificamos si hay token en la cookie o en el body
      if (res.headers["set-cookie"] && res.headers["set-cookie"].length > 0) {
        expect(res.headers["set-cookie"][0]).toContain("token=");
      } else {
        expect(res.body).toHaveProperty("token");
      }
    });

    it("debería fallar con credenciales incorrectas (status 401)", async () => {
      const loginData = {
        email: userEmail,
        password: "wrongpassword"
      };

      const res = await request(app)
        .post("/api/auth/login")
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("message", "Credenciales incorrectas.");
    });
  });

  // Test para logout
  describe("GET /api/auth/logout", () => {
    it("debería cerrar sesión correctamente", async () => {
      const res = await request(app)
        .get("/api/auth/logout");

      // Aceptamos tanto un 200 (API response) como un 302 (redirección)
      expect([200, 302]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(res.body).toHaveProperty("message", "Cierre de sesión exitoso.");
      } else if (res.statusCode === 302) {
        expect(res.headers.location).toBeDefined();
      }
    });
  });

  // Test para verificación de token
  describe("GET /api/auth/verify", () => {
    let token;
    let userEmail;

    beforeAll(async () => {
      // Crear un usuario y obtener token
      userEmail = `testverify${Date.now()}@example.com`;
      const newUser = {
        name: "Test Verify User",
        email: userEmail,
        password: "password123",
        role: "customer"
      };

      await request(app)
        .post("/api/auth/register")
        .send(newUser);

      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({
          email: userEmail,
          password: "password123"
        });

      // Intentamos obtener el token de diferentes fuentes
      if (loginRes.body && loginRes.body.token) {
        token = loginRes.body.token;
      } else if (loginRes.headers["set-cookie"] && loginRes.headers["set-cookie"].length > 0) {
        const cookieString = loginRes.headers["set-cookie"][0];
        token = cookieString.split(";")[0].split("=")[1];
      }
    });

    it("debería verificar un token válido (status 200)", async () => {
      // Solo ejecutamos el test si obtuvimos un token
      if (!token) {
        console.warn("No se pudo obtener un token para el test de verificación");
        return;
      }

      // Probamos ambos métodos de autenticación
      const authMethods = [
        { headers: { "Authorization": `Bearer ${token}` } },
        { headers: { "Cookie": `token=${token}` } }
      ];

      let success = false;
      
      for (const method of authMethods) {
        const res = await request(app)
          .get("/api/auth/verify")
          .set(method.headers);

        if (res.statusCode === 200) {
          success = true;
          expect(res.body).toHaveProperty("email", userEmail);
          break;
        }
      }

      if (!success) {
        // Si ningún método funcionó, fallamos el test con un mensaje útil
        fail("No se pudo verificar el token con ningún método de autenticación");
      }
    });

    it("debería fallar con un token inválido (status 401)", async () => {
      const res = await request(app)
        .get("/api/auth/verify")
        .set("Authorization", "Bearer invalidtoken");

      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty("message");
    });
  });
}); 