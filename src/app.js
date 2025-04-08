const express = require("express");
const cors = require("cors");
const passport = require("passport");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const db = require("./models");
const sequelize = db.sequelize;


const swaggerUi = require("swagger-ui-express");
const swaggerSpecs = require("./configs/swagger");
const morgan = require("morgan");

const app = express();
app.use(morgan("dev")); // Muestra logs detallados en la terminal
app.use(express.json());
app.use(cookieParser());


const corsOptions = {
	origin: "http://localhost:3000", // URL de tu frontend
	credentials: true, // Permite cookies
	allowedHeaders: ["Content-Type", "Authorization"],
	methods: ['GET', 'POST', 'PUT', 'DELETE'],
	cache: false, // Desactiva caché
};
app.use(cors(corsOptions)); // Habilita CORS con opciones 
require("./configs/passport")(passport);
app.use(passport.initialize());

// Documentación Swagger
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Rutas
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/user_routes"));
app.use("/api/products", require("./routes/product_routes"));
app.use("/api/orders", require("./routes/order_routes"));
app.use("/api/categories", require("./routes/category_routes"));
app.use("/api/cart", require("./routes/cart_routes"));

app.get("/status", (req, res) => {
	res.status(200).json({ status: "Server is running" });
});

const PORT = process.env.PORT || 777;
app.listen(PORT, () =>
	console.log(`🚀 Server Running Successfully on http://localhost:${PORT}`)
);

sequelize
	.authenticate()
	.then(() => console.log("✅ Conectado a PostgreSQL"))
	.catch((err) => console.error("❌ Error de conexión:", err));

sequelize
	.sync({ alter: true })
	.then(() => console.log("✅ Modelos sincronizados"))
	.catch((err) => console.error("❌ Error al sincronizar modelos:", err));
