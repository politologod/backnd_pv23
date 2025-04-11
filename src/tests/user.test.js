// tests/user.test.js
const request = require("supertest");
const jwt = require("jsonwebtoken");
const app = require("../app");

// Definí el JWT_SECRET para tests (si no lo tenés definido en el entorno)
process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecret";

// Generamos un token para un usuario admin de prueba
const adminToken = jwt.sign(
	{ id: 1, role: "admin", username: "testAdmin" },
	process.env.JWT_SECRET,
	{ expiresIn: "1h" }
);

describe("User Routes", () => {
	// Ejemplo para GET /api/users
	describe("GET /api/users", () => {
		it("debería devolver una lista de usuarios (status 200)", async () => {
			const res = await request(app)
				.get("/api/users")
				.set("Cookie", [`token=${adminToken}`]);
			expect(res.statusCode).toBe(200);
			// Si esperás un array:
			expect(Array.isArray(res.body)).toBe(true);
		});
	});

	// Ejemplo para GET /api/users/:id
	describe("GET /api/users/:id", () => {
		it("debería devolver el detalle de un usuario dado un ID (status 200) o 404 si no existe", async () => {
			// Suponiendo que el ID 1 existe en tu entorno de test
			const res = await request(app)
				.get("/api/users/1")
				.set("Cookie", [`token=${adminToken}`]);
			if (res.statusCode === 200) {
				expect(res.body).toHaveProperty("id", 1);
			} else {
				expect(res.statusCode).toBe(404);
			}
		});
	});

	// Ejemplo para POST /api/users
	describe("POST /api/users", () => {
		it("debería crear un nuevo usuario y devolverlo (status 201)", async () => {
			const newUser = {
				name: "Nuevo Usuario",
				email: "nuevo@ejemplo.com",
				password: "123456",
				phone: "1234567890",
				role: "customer",
				address: "123 Main St",
			};

			const res = await request(app)
				.post("/api/users")
				.set("Cookie", [`token=${adminToken}`])
				.send(newUser);

			expect(res.statusCode).toBe(201);
			expect(res.body).toHaveProperty("name", newUser.name);
		});
	});

	// Ejemplo para PUT /api/users/:id
	describe("PUT /api/users/:id", () => {
		it("debería actualizar un usuario existente (status 200) o 404 si no existe", async () => {
			const updateData = {
				username: "updatedUser",
				email: "updated@ejemplo.com",
				fullName: "Updated Name",
				phone: "0987654321",
				avatar: "https://example.com/avatar.png",
			};

			// Suponiendo que el usuario con ID 1 exista
			const res = await request(app)
				.put("/api/users/1")
				.set("Cookie", [`token=${adminToken}`])
				.send(updateData);

			if (res.statusCode === 200) {
				expect(res.body).toHaveProperty("username", updateData.username);
			} else {
				expect(res.statusCode).toBe(404);
			}
		});
	});

	// Ejemplo para DELETE /api/users/:id
	describe("DELETE /api/users/:id", () => {
		it("debería eliminar un usuario (status 200) o devolver 404 si el usuario no existe", async () => {
			// Suponiendo que el usuario con ID 1 exista; en un ambiente de test se puede crear y eliminar para no afectar datos reales
			const res = await request(app)
				.delete("/api/users/1")
				.set("Cookie", [`token=${adminToken}`]);

			// Dependiendo de la implementación de tu contro	lador
			if (res.statusCode === 200) {
				expect(res.body).toHaveProperty("message");
			} else {
				expect(res.statusCode).toBe(404);
			}
		});
	});
});
    
