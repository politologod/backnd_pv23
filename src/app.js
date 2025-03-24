	const express = require('express');
const cors = require("cors");
const passport = require("passport");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const sequelize = require("./configs/database");
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./configs/swagger');

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
require("./configs/passport")(passport);
app.use(passport.initialize()); 

// Documentación Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Rutas
app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/userRoute"));
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cards", require("./routes/cardRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));

app.get("/status", (req, res) => {
	res.status(200).json({ status: "Server is running" });
});

const PORT = process.env.PORT || 777;
app.listen(PORT, () => console.log(`🚀 Server Running Successfully on http://localhost:${PORT}`));

sequelize
	.authenticate()
	.then(() => console.log("✅ Conectado a PostgreSQL"))
	.catch((err) => console.error("❌ Error de conexión:", err));

sequelize
	.sync({ alter: true }) 
	.then(() => console.log("✅ Modelos sincronizados"))
	.catch((err) => console.error("❌ Error al sincronizar modelos:", err));