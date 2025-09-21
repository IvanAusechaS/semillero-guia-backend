<<<<<<< HEAD
# 🔧 Semillero GUIA - Backend API

API REST del **Semillero de Investigación en Inteligencia Artificial (Semillero GUIA)** de la Universidad del Valle.

## 📋 Descripción

Backend robusto desarrollado con Node.js, Express y SQLite que proporciona autenticación, gestión de usuarios, sistema de foro y APIs para el sitio web del semillero.

## 🛠️ Tecnologías

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Base de Datos:** SQLite con Sequelize ORM
- **Autenticación:** JWT (JSON Web Tokens)
- **Validación:** Express Validator
- **Seguridad:** Helmet, CORS, Rate Limiting
- **File Upload:** Multer
- **Logging:** Morgan

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18 o superior
- npm o yarn
- SQLite (incluido con el proyecto)

### Instalación Local

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/tu-usuario/semillero-guia-backend.git
   cd semillero-guia-backend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Editar `.env` con las configuraciones necesarias:
   ```env
   NODE_ENV=development
   PORT=4000
   DB_DIALECT=sqlite
   DB_STORAGE=database.sqlite
   JWT_SECRET=tu_jwt_secret_super_seguro_aqui
   JWT_EXPIRE=7d
   CLIENT_URL=http://localhost:3000
   ```

4. **Ejecutar en modo desarrollo**
   ```bash
   npm run dev
   ```
   
   El servidor estará disponible en `http://localhost:4000`
   
   La base de datos SQLite se creará automáticamente en `database.sqlite`

## 🐳 Docker

### Desarrollo con Docker

```bash
# Construir imagen
docker build -t semillero-guia-backend .

# Ejecutar contenedor
docker run -p 4000:4000 --env-file .env semillero-guia-backend
```

### Docker Compose (Para MongoDB Atlas/Cloud)

Si prefieres usar MongoDB Atlas en lugar de SQLite:

```bash
# Desde el directorio raíz del proyecto
docker-compose up backend
```

Esto iniciará:
- Backend API en `http://localhost:4000`

**Nota:** La versión actual usa SQLite por defecto para facilitar el desarrollo local.

## 📁 Estructura del Proyecto

```
src/
├── config/             # Configuraciones
│   └── database.js     # Conexión a SQLite con Sequelize
├── controllers/        # Controladores de rutas
│   ├── authController.js
│   ├── userController.js
│   ├── forumController.js
│   ├── projectController.js
│   ├── eventController.js
│   └── resourceController.js
├── middleware/         # Middlewares personalizados
│   ├── auth.js         # Autenticación JWT
│   ├── validation.js   # Validación de datos
│   └── errorHandler.js # Manejo de errores
├── models/             # Modelos de Sequelize
│   └── User.js         # Modelo de usuario
├── routes/             # Definición de rutas
│   ├── auth.js         # Rutas de autenticación
│   ├── users.js        # Rutas de usuarios
│   ├── forum.js        # Rutas del foro
│   ├── projects.js     # Rutas de proyectos
│   ├── events.js       # Rutas de eventos
│   └── resources.js    # Rutas de recursos
├── utils/              # Utilidades
│   ├── AppError.js     # Clase de errores personalizada
│   └── catchAsync.js   # Wrapper para async/await
└── index.js            # Archivo principal
```

## 🔐 Autenticación y Seguridad

### JWT Authentication
- Tokens con expiración configurable
- Refresh automático en el frontend
- Middleware de protección de rutas

### Roles de Usuario
- **estudiante:** Acceso básico, puede ver y subir tareas
- **docente:** Puede crear tareas y ver entregas
- **admin:** Acceso completo al sistema

### Medidas de Seguridad
- Rate limiting (100 requests/15min por IP)
- Sanitización de datos (MongoDB injection, XSS)
- Validación exhaustiva de entrada
- Headers de seguridad con Helmet
- CORS configurado

## 📡 API Endpoints

### Autenticación
```
POST   /api/auth/register    # Registro de usuario
POST   /api/auth/login       # Inicio de sesión
GET    /api/auth/me          # Perfil del usuario actual
PUT    /api/auth/profile     # Actualizar perfil
PUT    /api/auth/change-password # Cambiar contraseña
POST   /api/auth/logout      # Cerrar sesión
```

### Usuarios
```
GET    /api/users/team       # Obtener miembros del equipo (público)
GET    /api/users           # Listar usuarios (admin)
GET    /api/users/:id       # Obtener usuario específico
PUT    /api/users/:id       # Actualizar usuario (admin)
DELETE /api/users/:id       # Eliminar usuario (admin)
```

### Foro/Tareas
```
GET    /api/forum/assignments              # Listar tareas
POST   /api/forum/assignments              # Crear tarea (docente)
GET    /api/forum/assignments/:id          # Obtener tarea específica
POST   /api/forum/assignments/:id/submit   # Subir entrega (estudiante)
GET    /api/forum/assignments/:id/submissions # Ver entregas (docente)
PUT    /api/forum/submissions/:id/grade    # Calificar entrega (docente)
```

### Proyectos
```
GET    /api/projects        # Listar proyectos (público)
POST   /api/projects        # Crear proyecto (docente/admin)
GET    /api/projects/:id    # Obtener proyecto específico
PUT    /api/projects/:id    # Actualizar proyecto (docente/admin)
DELETE /api/projects/:id    # Eliminar proyecto (docente/admin)
```

### Eventos
```
GET    /api/events          # Listar eventos (público)
POST   /api/events          # Crear evento (docente/admin)
GET    /api/events/:id      # Obtener evento específico
PUT    /api/events/:id      # Actualizar evento (docente/admin)
DELETE /api/events/:id      # Eliminar evento (docente/admin)
```

### Recursos
```
GET    /api/resources       # Listar recursos (público)
POST   /api/resources       # Crear recurso (docente/admin)
GET    /api/resources/:id   # Obtener recurso específico
PUT    /api/resources/:id   # Actualizar recurso (docente/admin)
DELETE /api/resources/:id   # Eliminar recurso (docente/admin)
```

## 🗃️ Modelos de Datos

### Usuario (User)
```javascript
{
  name: String,           // Nombre completo
  email: String,          // Email único
  password: String,       // Hash de contraseña
  role: String,          // estudiante, docente, admin
  career: String,        // Carrera de estudio
  semester: Number,      // Semestre (solo estudiantes)
  roleInSemillero: String, // Rol en el semillero
  bio: String,           // Biografía
  skills: [String],      // Habilidades
  socialLinks: {         // Enlaces sociales
    github: String,
    linkedin: String,
    researchgate: String
  },
  profileImage: String,  // URL de imagen de perfil
  isActive: Boolean,     // Estado de la cuenta
  joinDate: Date,        // Fecha de ingreso
  lastLogin: Date        // Último inicio de sesión
}
```

## 🔧 Scripts Disponibles

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start

# Testing (por implementar)
npm test
```

## 🌐 Despliegue

### Railway (Recomendado)

1. Conectar repositorio a Railway
2. Configurar variables de entorno:
   ```env
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=tu_jwt_secret_production
   CLIENT_URL=https://tu-frontend.vercel.app
   ```
3. Deploy automático

### Render

1. Conectar repositorio a Render
2. Build command: `npm install`
3. Start command: `npm start`
4. Configurar variables de entorno

### Docker en Producción

```bash
# Usar docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Logging y Monitoreo

### Logs de Desarrollo
- Morgan para logging de requests HTTP
- Console.log para eventos de base de datos

### Health Check
- Endpoint: `GET /health`
- Información del sistema y tiempo de actividad

### Manejo de Errores
- Middleware global de manejo de errores
- Diferenciación entre errores operacionales y de programación
- Respuestas consistentes en formato JSON

## 🔧 Configuración de Desarrollo

### Variables de Entorno Requeridas

```env
# Entorno
NODE_ENV=development

# Servidor
PORT=4000

# Base de datos SQLite
DB_DIALECT=sqlite
DB_STORAGE=database.sqlite

# JWT
JWT_SECRET=tu_jwt_secret_aqui
JWT_EXPIRE=7d

# Cliente
CLIENT_URL=http://localhost:3000

# Archivos
MAX_FILE_SIZE=5000000
ALLOWED_FILE_TYPES=application/pdf,image/jpeg,image/png

# Email (opcional)
EMAIL_FROM=semillero.guia@correounivalle.edu.co
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=
SMTP_PASSWORD=
```

## 📁 Subida de Archivos

### Configuración
- **Tamaño máximo:** 5MB
- **Tipos permitidos:** PDF, JPG, PNG, GIF
- **Almacenamiento:** Local filesystem (`uploads/` directory)
- **Estructura:** `uploads/submissions/`

### Rutas de Archivos
```
GET /uploads/submissions/:filename  # Descargar archivo
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un Pull Request

### Convenciones de Código
- Usar **camelCase** para variables y funciones
- Usar **async/await** en lugar de Promises
- Documentar todas las funciones públicas
- Seguir patrones REST para las APIs

## 🐛 Problemas Conocidos

- Falta implementación de notificaciones por email
- Sistema de archivos local (considerar AWS S3 para producción)
- Falta implementación de tests unitarios
- Pendiente sistema de logging avanzado

## 🧪 Testing

```bash
# Por implementar
npm test
```

## 📞 Soporte

Para soporte técnico o preguntas:

- **Email:** semillero.guia@correounivalle.edu.co
- **Issues:** [GitHub Issues](https://github.com/tu-usuario/semillero-guia-backend/issues)

## 📄 Licencia

MIT License - ver [LICENSE](LICENSE) para más detalles.

---

**Desarrollado con ❤️ por el Semillero GUIA - Universidad del Valle**
=======
# semillero-guia-backend
Backend del Semillero de Investigación de la Escuela de Ingeniería de Sistemas y Computación — Universidad del Valle.
>>>>>>> e4c43a3adfae40f5a10b57fe9c7f17f78de76a33
