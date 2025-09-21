# 🚨 REQUERIMIENTOS CRÍTICOS PARA EL BACKEND
## Endpoints faltantes para completar la funcionalidad del Frontend

---

## 📋 RESUMEN EJECUTIVO

El frontend está implementado y desplegado, pero está fallando por **endpoints faltantes en el backend**. Los errores 404 indican que el backend MongoDB no tiene implementados los endpoints críticos para:

1. **Sistema de Asignaciones** (`/api/assignments/*`)
2. **Gestión de Envíos** (`/api/submissions/*`)
3. **Endpoints de Proyectos** (algunos endpoints)
4. **Health Check** (`/health`)

---

## 🔥 ENDPOINTS CRÍTICOS FALTANTES

### 1. **SISTEMA DE ASIGNACIONES (CRÍTICO)**

#### `GET /api/assignments/my`
**Estado**: ❌ **FALTANTE** (Causa principal de errores 404)
```javascript
// Endpoint requerido
GET /api/assignments/my
Query Params: {
  status?: 'pendiente' | 'en_progreso' | 'completado' | 'vencido',
  priority?: 'baja' | 'media' | 'alta' | 'critica',
  page?: number,
  limit?: number
}

// Respuesta esperada
{
  "status": "success",
  "assignments": [
    {
      "_id": "ObjectId",
      "title": "string",
      "description": "string",
      "project": {
        "_id": "ObjectId",
        "title": "string"
      },
      "assignedTo": ["ObjectId"],
      "assignedBy": {
        "_id": "ObjectId",
        "name": "string"
      },
      "dueDate": "Date",
      "priority": "baja|media|alta|critica",
      "status": "pendiente|en_progreso|completado|vencido",
      "attachments": ["string"],
      "createdAt": "Date",
      "updatedAt": "Date"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### `GET /api/assignments/:id`
**Estado**: ❌ **FALTANTE**
```javascript
// Endpoint requerido
GET /api/assignments/:id

// Respuesta esperada (con populate)
{
  "status": "success",
  "assignment": {
    "_id": "ObjectId",
    "title": "string",
    "description": "string",
    "project": {
      "_id": "ObjectId",
      "title": "string",
      "description": "string"
    },
    "assignedTo": [
      {
        "_id": "ObjectId",
        "name": "string",
        "email": "string"
      }
    ],
    "assignedBy": {
      "_id": "ObjectId",
      "name": "string",
      "role": "string"
    },
    "dueDate": "Date",
    "priority": "baja|media|alta|critica",
    "status": "pendiente|en_progreso|completado|vencido",
    "attachments": ["string"],
    "createdAt": "Date",
    "updatedAt": "Date"
  }
}
```

#### Otros endpoints de assignments
```javascript
POST /api/assignments           // Crear asignación
PUT /api/assignments/:id        // Actualizar asignación  
DELETE /api/assignments/:id     // Eliminar asignación
```

---

### 2. **SISTEMA DE ENVÍOS (CRÍTICO)**

#### `POST /api/submissions`
**Estado**: ❌ **FALTANTE**
```javascript
// Endpoint requerido
POST /api/submissions
Content-Type: multipart/form-data

Body: {
  assignment: "ObjectId",
  content: "string",
  attachments: File[] // FormData
}

// Respuesta esperada
{
  "status": "success",
  "submission": {
    "_id": "ObjectId",
    "assignment": "ObjectId",
    "student": "ObjectId",
    "content": "string",
    "attachments": ["string"],
    "submittedAt": "Date",
    "status": "enviado"
  }
}
```

#### `GET /api/assignments/:id/submissions`
**Estado**: ❌ **FALTANTE**
```javascript
// Endpoint requerido
GET /api/assignments/:assignmentId/submissions

// Respuesta esperada
{
  "status": "success",
  "submissions": [
    {
      "_id": "ObjectId",
      "assignment": "ObjectId",
      "student": {
        "_id": "ObjectId", 
        "name": "string",
        "email": "string"
      },
      "content": "string",
      "attachments": ["string"],
      "submittedAt": "Date",
      "grade": null,
      "feedback": null,
      "status": "enviado"
    }
  ]
}
```

#### `PUT /api/submissions/:id/grade`
**Estado**: ❌ **FALTANTE**
```javascript
// Endpoint requerido (para docentes)
PUT /api/submissions/:id/grade

Body: {
  grade: number,
  feedback: "string",
  status: "revisado|aprobado|rechazado"
}
```

---

### 3. **ENDPOINTS DE PROYECTOS (ALGUNAS FUNCIONES)**

#### `GET /api/projects/:id/assignments`
**Estado**: ❌ **FALTANTE**
```javascript
// Endpoint requerido para ProjectDetail
GET /api/projects/:projectId/assignments

// Respuesta esperada
{
  "status": "success",
  "assignments": [
    {
      "_id": "ObjectId",
      "title": "string",
      "description": "string",
      "dueDate": "Date",
      "priority": "string",
      "status": "string"
    }
  ]
}
```

---

### 4. **HEALTH CHECK Y CONFIGURACIÓN**

#### `GET /health`
**Estado**: ❌ **FALTANTE** (Devuelve 500 Internal Server Error)
```javascript
// Endpoint requerido
GET /health

// Respuesta esperada
{
  "status": "success",
  "message": "Server is running",
  "timestamp": "Date",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## 🏗️ MODELOS DE DATOS REQUERIDOS

### Assignment Model (MongoDB)
```javascript
const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  priority: {
    type: String,
    enum: ['baja', 'media', 'alta', 'critica'],
    default: 'media'
  },
  status: {
    type: String,
    enum: ['pendiente', 'en_progreso', 'completado', 'vencido'],
    default: 'pendiente'
  },
  attachments: [String]
}, {
  timestamps: true
});
```

### Submission Model (MongoDB)
```javascript
const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [String],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: Number,
    min: 0,
    max: 5
  },
  feedback: String,
  status: {
    type: String,
    enum: ['enviado', 'revisado', 'aprobado', 'rechazado'],
    default: 'enviado'
  }
}, {
  timestamps: true
});
```

---

## 🔐 MIDDLEWARE Y AUTENTICACIÓN

### Auth Middleware Requerido
```javascript
// Todos los endpoints de assignments y submissions requieren autenticación
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Token de acceso requerido'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: 'Token inválido'
    });
  }
};
```

### CORS Configuration
```javascript
// CORS debe permitir el dominio de Vercel
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://semillero-guia-front.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
```

---

## 📂 ESTRUCTURA DE ARCHIVOS SUGERIDA

```
backend/
├── routes/
│   ├── assignments.js      // ❌ FALTANTE
│   ├── submissions.js      // ❌ FALTANTE
│   ├── projects.js         // ✅ Parcial (falta /assignments)
│   └── auth.js             // ✅ Existe
├── models/
│   ├── Assignment.js       // ❌ FALTANTE
│   ├── Submission.js       // ❌ FALTANTE
│   ├── Project.js          // ✅ Existe
│   └── User.js             // ✅ Existe
├── controllers/
│   ├── assignmentController.js  // ❌ FALTANTE
│   ├── submissionController.js  // ❌ FALTANTE
│   └── projectController.js     // ✅ Parcial
└── middleware/
    ├── auth.js             // ✅ Existe
    └── upload.js           // ❌ FALTANTE (para archivos)
```

---

## 🎯 CONTROLADORES REQUERIDOS

### Assignment Controller
```javascript
// controllers/assignmentController.js
const getMyAssignments = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const userId = req.user._id;

    const filter = {
      assignedTo: userId
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const assignments = await Assignment.find(filter)
      .populate('project', 'title description')
      .populate('assignedBy', 'name role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Assignment.countDocuments(filter);

    res.json({
      status: 'success',
      assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener asignaciones',
      error: error.message
    });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await Assignment.findById(id)
      .populate('project', 'title description')
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name role');

    if (!assignment) {
      return res.status(404).json({
        status: 'error',
        message: 'Asignación no encontrada'
      });
    }

    res.json({
      status: 'success',
      assignment
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al obtener asignación',
      error: error.message
    });
  }
};

module.exports = {
  getMyAssignments,
  getAssignmentById,
  // ... otros métodos
};
```

### Submission Controller
```javascript
// controllers/submissionController.js
const createSubmission = async (req, res) => {
  try {
    const { assignment, content } = req.body;
    const student = req.user._id;
    
    // Verificar que la asignación existe
    const assignmentExists = await Assignment.findById(assignment);
    if (!assignmentExists) {
      return res.status(404).json({
        status: 'error',
        message: 'Asignación no encontrada'
      });
    }

    // Verificar que el usuario está asignado
    if (!assignmentExists.assignedTo.includes(student)) {
      return res.status(403).json({
        status: 'error',
        message: 'No tienes permisos para enviar esta asignación'
      });
    }

    // Manejar archivos adjuntos
    const attachments = req.files ? req.files.map(file => file.filename) : [];

    const submission = new Submission({
      assignment,
      student,
      content,
      attachments
    });

    await submission.save();

    res.status(201).json({
      status: 'success',
      submission
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error al crear envío',
      error: error.message
    });
  }
};

module.exports = {
  createSubmission,
  // ... otros métodos
};
```

---

## 🛠️ CONFIGURACIÓN DE MULTER PARA ARCHIVOS

```javascript
// middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/submissions/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Solo se permiten archivos de imagen y documentos');
    }
  }
});

module.exports = upload;
```

---

## 🚨 PASOS INMEDIATOS PARA EL BACKEND

### Fase 1: CRÍTICA (Resolver errores 404)
1. **Crear modelo Assignment** con el esquema especificado
2. **Crear modelo Submission** con el esquema especificado
3. **Implementar GET /api/assignments/my** (Dashboard depende de esto)
4. **Implementar GET /api/assignments/:id** (AssignmentDetail depende de esto)
5. **Configurar CORS** para permitir el dominio de Vercel
6. **Crear health check** básico

### Fase 2: FUNCIONALIDAD COMPLETA
1. **Implementar POST /api/submissions** (para envío de tareas)
2. **Implementar GET /api/assignments/:id/submissions** (para ver envíos)
3. **Agregar middleware de upload** para archivos
4. **Implementar endpoints de creación/edición** de assignments

### Fase 3: OPTIMIZACIÓN
1. **Implementar paginación** correcta
2. **Agregar filtros avanzados**
3. **Optimizar populate queries**
4. **Agregar validaciones** de datos

---

## 🧪 TESTING ENDPOINTS

### Postman Collection Requerida
```javascript
// GET /api/assignments/my
GET {{base_url}}/api/assignments/my?status=pendiente&limit=5
Authorization: Bearer {{token}}

// GET /api/assignments/:id  
GET {{base_url}}/api/assignments/{{assignment_id}}
Authorization: Bearer {{token}}

// POST /api/submissions
POST {{base_url}}/api/submissions
Authorization: Bearer {{token}}
Content-Type: multipart/form-data
Body: {
  assignment: "{{assignment_id}}",
  content: "Mi solución...",
  attachments: [file]
}
```

---

## 💾 VARIABLES DE ENTORNO REQUERIDAS

```bash
# .env (Backend)
PORT=4000
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/semillero_guia
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=https://semillero-guia-front.vercel.app,http://localhost:3000
FILE_UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

---

## 📊 ESTADO ACTUAL VS REQUERIDO

| Endpoint | Estado | Prioridad | Afecta a |
|----------|--------|-----------|-----------|
| `GET /api/assignments/my` | ❌ Faltante | 🔥 CRÍTICA | Dashboard, AssignmentList |
| `GET /api/assignments/:id` | ❌ Faltante | 🔥 CRÍTICA | AssignmentDetail |
| `POST /api/submissions` | ❌ Faltante | 🔶 ALTA | Envío de tareas |
| `GET /assignments/:id/submissions` | ❌ Faltante | 🔶 ALTA | Ver envíos (docentes) |
| `GET /health` | ❌ Error 500 | 🔶 ALTA | Monitoreo |
| `GET /api/projects/:id/assignments` | ❌ Faltante | 🔷 MEDIA | ProjectDetail |

---

## ✅ CHECKLIST PARA EL DESARROLLADOR BACKEND

- [ ] Crear modelo `Assignment` en MongoDB
- [ ] Crear modelo `Submission` en MongoDB  
- [ ] Implementar `GET /api/assignments/my` con filtros y paginación
- [ ] Implementar `GET /api/assignments/:id` con populate
- [ ] Implementar `POST /api/submissions` con upload de archivos
- [ ] Implementar `GET /api/assignments/:id/submissions`
- [ ] Configurar CORS para dominio de Vercel
- [ ] Crear endpoint `/health` funcional
- [ ] Configurar middleware de autenticación
- [ ] Configurar middleware de upload (multer)
- [ ] Probar todos los endpoints con Postman
- [ ] Desplegar cambios en Heroku

---

## 🎯 RESULTADO ESPERADO

Una vez implementados estos endpoints, el frontend debería:

✅ **Dashboard**: Mostrar asignaciones pendientes sin errores 404  
✅ **AssignmentList**: Listar todas las asignaciones del usuario  
✅ **AssignmentDetail**: Mostrar detalles completos de cada asignación  
✅ **Submission System**: Permitir envío de tareas con archivos  
✅ **Project Integration**: Mostrar asignaciones relacionadas a proyectos  

---

**🚀 Con estos cambios, el sistema estará 100% funcional y sin errores 404.**