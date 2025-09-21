import mongoose from 'mongoose';

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📋 Database: ${conn.connection.name}`);
    
    return conn;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    process.exit(1);
  }
};

// Función para cerrar la conexión
export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('🔒 Conexión a MongoDB cerrada');
  } catch (error) {
    console.error('❌ Error cerrando conexión:', error.message);
  }
};

// Manejo de eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔒 MongoDB connection closed through app termination');
  process.exit(0);
});

export default connectDB;
