# 🚀 Despliegue en Heroku - Semillero GUIA Backend

## 📋 Prerequisitos

1. **Cuenta de Heroku**: Crear cuenta en [heroku.com](https://heroku.com)
2. **Heroku CLI**: Instalar desde [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)
3. **MongoDB Atlas**: Base de datos configurada y funcionando
4. **Git**: Repositorio con todos los cambios committeados

## 🔧 Preparación Pre-Despliegue

### 1. Verificar Archivos de Configuración
Asegurar que estos archivos existan y estén correctos:
- ✅ `Procfile` - Especifica cómo ejecutar la app
- ✅ `package.json` - Con scripts y engines definidos
- ✅ `.env.example` - Documentación de variables de entorno

### 2. Verificar Dependencias
```bash
npm audit
npm update
```

## 🚀 Proceso de Despliegue

### Paso 1: Login en Heroku
```bash
heroku login
```

### Paso 2: Crear Aplicación en Heroku
```bash
# Crear nueva app (reemplaza 'semillero-guia-api' por tu nombre preferido)
heroku create semillero-guia-api

# O si ya tienes el nombre:
heroku create tu-nombre-de-app
```

### Paso 3: Configurar Variables de Entorno
```bash
# Variables esenciales para MongoDB
heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/semillero-guia?retryWrites=true&w=majority"

# JWT Configuration
heroku config:set JWT_SECRET="tu-jwt-secret-super-seguro-generado-random"
heroku config:set JWT_EXPIRES_IN="7d"
heroku config:set JWT_COOKIE_EXPIRES_IN="604800000"

# Environment
heroku config:set NODE_ENV="production"
heroku config:set DATABASE_NAME="semillero-guia"

# Frontend URL (actualizar con tu dominio de frontend)
heroku config:set FRONTEND_URL="https://tu-frontend-domain.com,http://localhost:3000"

# Configuración de archivos
heroku config:set MAX_FILE_SIZE="10485760"
heroku config:set UPLOAD_DIR="uploads"
heroku config:set ALLOWED_FILE_TYPES="application/pdf,image/jpeg,image/png,image/gif,text/plain"

# Rate limiting
heroku config:set RATE_LIMIT_MAX="100"
heroku config:set RATE_LIMIT_WINDOW_MS="900000"

# Email (opcional)
heroku config:set EMAIL_FROM="semillero.guia@correounivalle.edu.co"
heroku config:set SMTP_HOST="smtp.gmail.com"
heroku config:set SMTP_PORT="587"
```

### Paso 4: Desplegar la Aplicación
```bash
# Asegurar que estás en la rama correcta
git checkout develop  # o main, según tu flujo

# Push a Heroku
git push heroku develop:main  # o git push heroku main

# O si quieres hacer deploy desde feature branch:
git push heroku feature/migrate-to-mongodb:main
```

### Paso 5: Verificar el Despliegue
```bash
# Ver logs en tiempo real
heroku logs --tail

# Abrir la aplicación en el navegador
heroku open

# Verificar status
heroku ps:scale web=1
```

## 🔍 Verificación Post-Despliegue

### 1. Health Check
Visitar: `https://tu-app.herokuapp.com/health`

Respuesta esperada:
```json
{
  "status": "success",
  "message": "Servidor funcionando correctamente",
  "timestamp": "2025-09-20T...",
  "environment": "production",
  "database": "connected",
  "version": "1.0.0"
}
```

### 2. Probar Endpoints Principales
```bash
# Registro de usuario
curl -X POST https://tu-app.herokuapp.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@test.com",
    "password": "password123",
    "role": "estudiante",
    "career": "Ingeniería de Sistemas",
    "semester": 5
  }'

# Login
curl -X POST https://tu-app.herokuapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "password123"
  }'
```

## 🔧 Comandos Útiles de Heroku

```bash
# Ver configuración actual
heroku config

# Ver logs de la aplicación
heroku logs --tail

# Acceder a la consola de la aplicación
heroku run bash

# Reiniciar la aplicación
heroku restart

# Ver métricas
heroku logs --ps web

# Escalar la aplicación
heroku ps:scale web=1

# Ver releases
heroku releases

# Rollback a versión anterior
heroku rollback v123
```

## 🐛 Solución de Problemas Comunes

### Error: "Application Error"
```bash
heroku logs --tail
```
Buscar errores específicos en los logs.

### Error de Conexión a MongoDB
- Verificar `MONGODB_URI` con `heroku config`
- Asegurar que MongoDB Atlas permite conexiones desde cualquier IP (0.0.0.0/0)
- Verificar credentials de la base de datos

### Error de Variables de Entorno
```bash
heroku config:set VARIABLE_NAME="value"
```

### Error de Puerto
Heroku asigna automáticamente el puerto. El código debe usar:
```javascript
const PORT = process.env.PORT || 4000;
```

## 📱 Configuración de Dominio Personalizado (Opcional)

```bash
# Agregar dominio personalizado
heroku domains:add tu-dominio.com

# Ver dominios configurados
heroku domains

# Configurar SSL automático
heroku certs:auto:enable
```

## 🔄 Actualizaciones Futuras

Para actualizaciones posteriores:
```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push origin develop
git push heroku develop:main
```

## 📊 Monitoreo y Métricas

1. **Heroku Dashboard**: Ver métricas en tiempo real
2. **Logs**: `heroku logs --tail` para debugging
3. **MongoDB Atlas**: Monitorear performance de la base de datos

## 🆘 Soporte

- **Heroku Docs**: [devcenter.heroku.com](https://devcenter.heroku.com)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)
- **Logs de errores**: `heroku logs --tail`

---

## ✅ Checklist de Despliegue

- [ ] Cuenta de Heroku creada
- [ ] Heroku CLI instalado
- [ ] MongoDB Atlas configurado
- [ ] Variables de entorno configuradas
- [ ] Aplicación desplegada
- [ ] Health check funcionando
- [ ] Endpoints principales probados
- [ ] Logs verificados
- [ ] Frontend actualizado con nueva URL