import { Sequelize } from "sequelize";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar SQLite
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "../../database.sqlite"),
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  define: {
    timestamps: true,
    underscored: false,
  },
});

// Función para conectar a la base de datos
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Conectado a SQLite exitosamente");

    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ alter: true });
    console.log("📋 Tablas sincronizadas");
  } catch (error) {
    console.error("❌ Error conectando a SQLite:", error.message);
    process.exit(1);
  }
};

// Función para cerrar la conexión
export const closeDB = async () => {
  try {
    await sequelize.close();
    console.log("🔒 Conexión a SQLite cerrada");
  } catch (error) {
    console.error("❌ Error cerrando conexión:", error.message);
  }
};

export { sequelize };
export default connectDB;
