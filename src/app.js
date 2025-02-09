const express = require('express');
const cors = require("cors");
const passport = require("passport");
require("dotenv").config();
const cookieParser = require("cookie-parser");
const sequelize = require("./configs/database");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
require("./configs/passport")(passport);
app.use(passport.initialize()); 
const PORT = process.env.PORT || 777;
app.listen(PORT, () => console.log(`🚀 Server Running Successfully on http://localhost:${PORT}`));






app.use("/api/auth", require("./routes/auth"));

app.get("/status", (req, res) => {
	res.status(200).json({ status: "Server is running" });
});

app.use("/api/users", require("./routes/userRoute"));

sequelize
	.authenticate()
	.then(() => console.log("✅ Conectado a PostgreSQL"))
	.catch((err) => console.error("❌ Error de conexión:", err));

	sequelize
	.sync({ alter: true }) 
	.then(() => console.log("✅ Modelos sincronizados"))
	.catch((err) => console.error("❌ Error al sincronizar modelos:", err));