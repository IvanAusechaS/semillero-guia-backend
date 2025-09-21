# 🎯 PROMPT COMPLETO PARA ACTUALIZACIÓN DEL FRONTEND
# Migración de SQLite a MongoDB - Semillero GUIA

---

## 🚨 CONTEXTO CRÍTICO

El backend del Semillero GUIA ha sido **completamente migrado de SQLite + Sequelize a MongoDB + Mongoose**. Esta migración requiere actualizaciones específicas en el frontend para mantener la compatibilidad y aprovechar las nuevas capacidades.

---

## 📋 CAMBIOS PRINCIPALES EN EL BACKEND

### 🔄 Base de Datos
- **ANTES**: SQLite local con Sequelize ORM
- **AHORA**: MongoDB Atlas (cloud) con Mongoose ODM
- **IDs**: Cambiaron de integers secuenciales a ObjectIds de MongoDB (strings de 24 caracteres hexadecimales)

### 🏗️ Modelos Actualizados

#### 1. **User Model** (Crítico)
```javascript
// Estructura del Usuario (MongoDB)
{
  _id: ObjectId("64f8b9c2e1a5f2b3c4d5e6f7"), // String de 24 chars
  name: String,
  email: String (único),
  password: String (hasheado),
  role: "estudiante" | "docente" | "admin",
  career: String,
  semester: Number,
  roleInSemillero: String,
  bio: String,
  skills: [String],
  profileImage: String,
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### 2. **Project Model** (Nuevo)
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  category: "investigacion" | "desarrollo" | "extension",
  status: "planificacion" | "en_progreso" | "completado" | "pausado",
  startDate: Date,
  endDate: Date,
  leader: ObjectId (referencia a User),
  members: [ObjectId] (referencias a Users),
  assignments: [ObjectId] (referencias a Assignments),
  resources: [ObjectId] (referencias a Resources),
  tags: [String],
  visibility: "publico" | "privado" | "semillero",
  createdAt: Date,
  updatedAt: Date
}
```

#### 3. **Assignment Model** (Nuevo)
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  project: ObjectId (referencia a Project),
  assignedTo: [ObjectId] (referencias a Users),
  assignedBy: ObjectId (referencia a User),
  dueDate: Date,
  priority: "baja" | "media" | "alta" | "critica",
  status: "pendiente" | "en_progreso" | "completado" | "vencido",
  submissions: [ObjectId] (referencias a Submissions),
  attachments: [String],
  createdAt: Date,
  updatedAt: Date
}
```

#### 4. **Submission Model** (Nuevo)
```javascript
{
  _id: ObjectId,
  assignment: ObjectId (referencia a Assignment),
  student: ObjectId (referencia a User),
  content: String,
  attachments: [String],
  submittedAt: Date,
  grade: Number,
  feedback: String,
  status: "enviado" | "revisado" | "aprobado" | "rechazado",
  createdAt: Date,
  updatedAt: Date
}
```

#### 5. **Event Model** (Actualizado)
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  type: "seminario" | "taller" | "conferencia" | "reunion" | "presentacion",
  startDate: Date,
  endDate: Date,
  location: String,
  isVirtual: Boolean,
  meetingLink: String,
  organizer: ObjectId (referencia a User),
  attendees: [ObjectId] (referencias a Users),
  maxAttendees: Number,
  registrationRequired: Boolean,
  status: "programado" | "en_curso" | "completado" | "cancelado",
  tags: [String],
  attachments: [String],
  createdAt: Date,
  updatedAt: Date
}
```

#### 6. **Resource Model** (Actualizado)
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  type: "documento" | "video" | "enlace" | "software" | "dataset",
  url: String,
  filePath: String,
  uploadedBy: ObjectId (referencia a User),
  category: String,
  tags: [String],
  isPublic: Boolean,
  downloadCount: Number,
  fileSize: Number,
  mimeType: String,
  approvedBy: ObjectId (referencia a User),
  status: "pendiente" | "aprobado" | "rechazado",
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔧 ENDPOINTS API ACTUALIZADOS

### Base URL
- **Desarrollo**: `http://localhost:4000`
- **Producción**: `https://tu-app.herokuapp.com`

### 🔐 Autenticación
```javascript
// Login (sin cambios en estructura)
POST /api/auth/login
Body: { email, password }
Response: { status, message, token, user }

// Registro (sin cambios en estructura)
POST /api/auth/register
Body: { name, email, password, role, career, semester }
Response: { status, message, token, user }

// Perfil (sin cambios)
GET /api/auth/me
Headers: { Authorization: "Bearer <token>" }
Response: { status, user }

// Actualizar perfil
PUT /api/auth/profile
Headers: { Authorization: "Bearer <token>" }
Body: { name, bio, skills, roleInSemillero }
```

### 👥 Usuarios
```javascript
// Listar usuarios
GET /api/users?role=estudiante&page=1&limit=10
Response: { status, users, pagination }

// Usuario por ID (IMPORTANTE: Usar ObjectId)
GET /api/users/:id  // :id debe ser ObjectId válido
Response: { status, user }

// Actualizar usuario (admin/docente)
PUT /api/users/:id
Body: { name, role, isActive, semester }
```

### 📊 Proyectos (NUEVO)
```javascript
// Listar proyectos
GET /api/projects?category=investigacion&status=en_progreso&page=1
Response: { status, projects, pagination }

// Crear proyecto
POST /api/projects
Body: { title, description, category, startDate, endDate, members }
Response: { status, project }

// Proyecto por ID
GET /api/projects/:id
Response: { status, project } // Con populate de leader y members

// Actualizar proyecto
PUT /api/projects/:id
Body: { title, description, status, members }

// Eliminar proyecto
DELETE /api/projects/:id

// Unirse a proyecto
POST /api/projects/:id/join
Response: { status, message }

// Salir de proyecto
POST /api/projects/:id/leave
Response: { status, message }
```

### 📝 Asignaciones (NUEVO)
```javascript
// Asignaciones del usuario
GET /api/assignments/my?status=pendiente
Response: { status, assignments }

// Crear asignación
POST /api/assignments
Body: { title, description, project, assignedTo, dueDate, priority }
Response: { status, assignment }

// Asignación por ID
GET /api/assignments/:id
Response: { status, assignment } // Con populate de project y assignedTo

// Actualizar asignación
PUT /api/assignments/:id
Body: { title, description, status, dueDate }

// Eliminar asignación
DELETE /api/assignments/:id
```

### 📄 Envíos (NUEVO)
```javascript
// Enviar asignación
POST /api/submissions
Body: { assignment, content } + FormData para archivos
Response: { status, submission }

// Envíos de una asignación
GET /api/assignments/:id/submissions
Response: { status, submissions }

// Calificar envío
PUT /api/submissions/:id/grade
Body: { grade, feedback, status }
Response: { status, submission }
```

### 📅 Eventos (Estructura actualizada)
```javascript
// Listar eventos
GET /api/events?type=seminario&upcoming=true
Response: { status, events, pagination }

// Crear evento
POST /api/events
Body: { title, description, type, startDate, endDate, location, maxAttendees }
Response: { status, event }

// Registrarse a evento
POST /api/events/:id/register
Response: { status, message }

// Cancelar registro
DELETE /api/events/:id/register
Response: { status, message }
```

### 📚 Recursos (Estructura actualizada)
```javascript
// Listar recursos
GET /api/resources?type=documento&category=investigacion&public=true
Response: { status, resources, pagination }

// Subir recurso
POST /api/resources
Body: FormData { title, description, type, category, file }
Response: { status, resource }

// Descargar recurso
GET /api/resources/:id/download
Response: File download
```

---

## 🔄 CAMBIOS CRÍTICOS PARA EL FRONTEND

### 1. **Manejo de IDs**
```javascript
// ANTES (SQLite)
const userId = 1; // Number
const url = `/api/users/${userId}`;

// AHORA (MongoDB)
const userId = "64f8b9c2e1a5f2b3c4d5e6f7"; // String (ObjectId)
const url = `/api/users/${userId}`;

// Validación de ObjectId
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};
```

### 2. **Estructura de Respuestas**
```javascript
// Usuario response
{
  status: "success",
  user: {
    _id: "64f8b9c2e1a5f2b3c4d5e6f7", // Cambió de 'id' a '_id'
    name: "Juan Pérez",
    email: "juan@univalle.edu.co",
    role: "estudiante",
    career: "Ingeniería de Sistemas",
    semester: 8,
    bio: "Estudiante de IA",
    skills: ["Python", "Machine Learning"],
    createdAt: "2023-09-20T10:30:00.000Z",
    updatedAt: "2023-09-20T15:45:00.000Z"
  }
}
```

### 3. **Nuevas Funcionalidades a Implementar**

#### Dashboard de Proyectos
```javascript
// Componente: ProjectDashboard
const fetchProjects = async () => {
  const response = await api.get('/api/projects', {
    params: { page: 1, limit: 10, status: 'en_progreso' }
  });
  return response.data.projects;
};
```

#### Sistema de Asignaciones
```javascript
// Componente: AssignmentList
const fetchMyAssignments = async () => {
  const response = await api.get('/api/assignments/my', {
    params: { status: 'pendiente' }
  });
  return response.data.assignments;
};
```

#### Envío de Tareas
```javascript
// Componente: SubmissionForm
const submitAssignment = async (assignmentId, formData) => {
  const response = await api.post('/api/submissions', {
    assignment: assignmentId,
    content: formData.get('content'),
    ...formData // Para archivos
  }, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.submission;
};
```

### 4. **Estados y Enums Nuevos**
```javascript
// Estados de proyectos
const PROJECT_STATUS = {
  PLANNING: 'planificacion',
  IN_PROGRESS: 'en_progreso',
  COMPLETED: 'completado',
  PAUSED: 'pausado'
};

// Tipos de eventos
const EVENT_TYPES = {
  SEMINAR: 'seminario',
  WORKSHOP: 'taller',
  CONFERENCE: 'conferencia',
  MEETING: 'reunion',
  PRESENTATION: 'presentacion'
};

// Prioridades de asignaciones
const ASSIGNMENT_PRIORITY = {
  LOW: 'baja',
  MEDIUM: 'media',
  HIGH: 'alta',
  CRITICAL: 'critica'
};
```

---

## 🎨 COMPONENTES NUEVOS A CREAR

### 1. **ProjectCard.jsx**
```javascript
const ProjectCard = ({ project }) => {
  return (
    <div className="project-card">
      <h3>{project.title}</h3>
      <p>Estado: {project.status}</p>
      <p>Líder: {project.leader.name}</p>
      <p>Miembros: {project.members.length}</p>
      <div className="project-actions">
        <button onClick={() => viewProject(project._id)}>Ver</button>
        {canEdit && <button onClick={() => editProject(project._id)}>Editar</button>}
      </div>
    </div>
  );
};
```

### 2. **AssignmentList.jsx**
```javascript
const AssignmentList = ({ assignments }) => {
  const getPriorityColor = (priority) => {
    const colors = {
      'baja': 'green',
      'media': 'yellow',
      'alta': 'orange',
      'critica': 'red'
    };
    return colors[priority];
  };

  return (
    <div className="assignment-list">
      {assignments.map(assignment => (
        <div key={assignment._id} className="assignment-item">
          <h4>{assignment.title}</h4>
          <span className={`priority priority-${assignment.priority}`}>
            {assignment.priority}
          </span>
          <p>Vence: {new Date(assignment.dueDate).toLocaleDateString()}</p>
          <button onClick={() => openAssignment(assignment._id)}>
            Abrir
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 3. **EventRegistration.jsx**
```javascript
const EventRegistration = ({ event }) => {
  const [isRegistered, setIsRegistered] = useState(false);

  const handleRegistration = async () => {
    try {
      if (isRegistered) {
        await api.delete(`/api/events/${event._id}/register`);
        setIsRegistered(false);
      } else {
        await api.post(`/api/events/${event._id}/register`);
        setIsRegistered(true);
      }
    } catch (error) {
      console.error('Error en registro:', error);
    }
  };

  return (
    <div className="event-card">
      <h3>{event.title}</h3>
      <p>Fecha: {new Date(event.startDate).toLocaleDateString()}</p>
      <p>Ubicación: {event.location}</p>
      {event.isVirtual && (
        <a href={event.meetingLink} target="_blank" rel="noopener noreferrer">
          Unirse virtualmente
        </a>
      )}
      <button 
        onClick={handleRegistration}
        className={isRegistered ? 'btn-danger' : 'btn-primary'}
      >
        {isRegistered ? 'Cancelar registro' : 'Registrarse'}
      </button>
    </div>
  );
};
```

---

## 🔒 AUTENTICACIÓN Y AUTORIZACIÓN

### Roles y Permisos (Sin cambios)
```javascript
const ROLES = {
  STUDENT: 'estudiante',
  TEACHER: 'docente',
  ADMIN: 'admin'
};

// Permisos por rol (verificar en backend)
const PERMISSIONS = {
  estudiante: ['read_projects', 'join_projects', 'submit_assignments'],
  docente: ['all_estudiante', 'create_projects', 'grade_assignments', 'create_events'],
  admin: ['all_permissions']
};
```

### Token JWT (Sin cambios)
```javascript
// El token sigue igual, pero el user object tiene _id en lugar de id
const token = localStorage.getItem('token');
const user = jwtDecode(token);
console.log(user._id); // ObjectId string
```

---

## 📱 RUTAS FRONTEND SUGERIDAS

```javascript
// App.jsx
const routes = [
  // Existentes (mantener)
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/dashboard', component: Dashboard },
  { path: '/profile', component: Profile },
  
  // Nuevas rutas para proyectos
  { path: '/projects', component: ProjectList },
  { path: '/projects/:id', component: ProjectDetail },
  { path: '/projects/create', component: ProjectForm },
  
  // Nuevas rutas para asignaciones
  { path: '/assignments', component: AssignmentList },
  { path: '/assignments/:id', component: AssignmentDetail },
  { path: '/assignments/:id/submit', component: SubmissionForm },
  
  // Rutas de eventos (actualizar)
  { path: '/events', component: EventList },
  { path: '/events/:id', component: EventDetail },
  
  // Rutas de recursos (actualizar)
  { path: '/resources', component: ResourceList },
  { path: '/resources/upload', component: ResourceUpload },
];
```

---

## 🧪 TESTING CON POSTMAN

Se ha creado una colección completa de Postman que incluye:

1. **Environment Variables**:
   - `base_url`: URL del servidor
   - `auth_token`: Token JWT automático
   - `user_id`: ID del usuario logueado

2. **Collections**:
   - ✅ Authentication (login, register, profile)
   - ✅ Users Management
   - ✅ Projects CRUD
   - ✅ Assignments & Submissions
   - ✅ Events Management
   - ✅ Resources Management

3. **Automated Tests**:
   - Validación de response status
   - Verificación de estructura JSON
   - Tests de autorización
   - Validación de ObjectIds

---

## 🚀 PLAN DE MIGRACIÓN FRONTEND

### Fase 1: Actualización Base (Prioritario)
1. **Cambiar todas las referencias de `id` a `_id`**
2. **Actualizar validaciones de ID** (ObjectId format)
3. **Verificar endpoints existentes** (auth, users, events, resources)
4. **Actualizar tipos TypeScript** (si aplica)

### Fase 2: Nuevas Funcionalidades
1. **Implementar gestión de proyectos**
2. **Crear sistema de asignaciones**
3. **Implementar envío de tareas**
4. **Actualizar dashboard principal**

### Fase 3: Mejoras UX
1. **Mejorar filtros y búsquedas**
2. **Implementar notificaciones en tiempo real**
3. **Agregar dashboard de estadísticas**
4. **Optimizar rendimiento con paginación**

---

## ⚠️ CONSIDERACIONES IMPORTANTES

1. **Backward Compatibility**: Los endpoints mantienen la misma estructura de respuesta, solo cambian los IDs
2. **Error Handling**: Manejar errores específicos de MongoDB (ObjectId inválido, etc.)
3. **Performance**: Implementar paginación para listas grandes
4. **Security**: Validar ObjectIds en el frontend antes de enviar requests
5. **UX**: Proporcionar feedback visual para operaciones asíncronas

---

## 📞 ENDPOINTS DE TESTING

Para verificar que todo funciona:

```bash
# Health check
GET https://tu-app.herokuapp.com/health

# Login test
POST https://tu-app.herokuapp.com/api/auth/login
{
  "email": "test@test.com",
  "password": "password123"
}

# Projects test
GET https://tu-app.herokuapp.com/api/projects
Authorization: Bearer <token>
```

---

## 📈 PRÓXIMOS PASOS

1. **Revisar este prompt completo**
2. **Planificar la migración por fases**
3. **Actualizar dependencias del frontend si es necesario**
4. **Implementar cambios básicos primero** (IDs, endpoints existentes)
5. **Agregar nuevas funcionalidades gradualmente**
6. **Probar exhaustivamente con Postman collection**

¡El backend está completamente listo y funcionando en MongoDB! 🚀