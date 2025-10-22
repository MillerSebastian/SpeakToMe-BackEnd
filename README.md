# SpeakToMe Backend API

Backend API para la aplicación SpeakToMe - Plataforma de salud mental universitaria de la Universidad RIWI.

## 🚀 Características

- **Autenticación JWT** con refresh tokens
- **Sistema de roles** (TL Mayor, Psicólogo, Estudiante)
- **Gestión de citas** con psicólogos
- **Sistema de mensajería** en tiempo real
- **Blog de estados emocionales** para estudiantes
- **Notificaciones** del sistema
- **Logging completo** con Winston
- **Rate limiting** para seguridad
- **Validación de datos** con Joi
- **Manejo de errores** robusto
- **Documentación API** completa

## 🛠️ Tecnologías

- **Node.js** con **TypeScript**
- **Express.js** como framework web
- **MySQL** como base de datos
- **JWT** para autenticación
- **Winston** para logging
- **Joi** para validación
- **Nodemailer** para emails
- **Bcryptjs** para hash de contraseñas

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- MySQL (v8.0 o superior)
- npm o yarn

## 🔧 Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd speakToMeBackend
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp env.example .env
```

Editar el archivo `.env` con tus configuraciones:

```env
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=speaktome_db
DB_USER=root
DB_PASSWORD=tu_password

# Servidor
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=tu_super_secreto_jwt
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_app_password
```

4. **Crear la base de datos**

```sql
CREATE DATABASE speaktome_db;
```

5. **Ejecutar el script SQL**
   Importar el archivo `database.sql` en tu base de datos MySQL.

6. **Compilar TypeScript**

```bash
npm run build
```

7. **Iniciar el servidor**

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

## 📚 Estructura del Proyecto

```
src/
├── config/           # Configuraciones
│   ├── database.ts   # Configuración de BD
│   └── index.ts      # Configuración general
├── controllers/      # Controladores
│   ├── authController.ts
│   ├── userController.ts
│   ├── appointmentController.ts
│   ├── messageController.ts
│   └── profileController.ts
├── middleware/       # Middlewares
│   ├── auth.ts       # Autenticación
│   ├── validation.ts # Validación
│   ├── errorHandler.ts
│   └── rateLimiter.ts
├── models/          # Modelos de datos
│   ├── User.ts
│   ├── Appointment.ts
│   ├── Message.ts
│   └── Profile.ts
├── routes/          # Rutas de la API
│   ├── auth.ts
│   ├── users.ts
│   ├── appointments.ts
│   ├── messages.ts
│   ├── profiles.ts
│   └── index.ts
├── services/        # Servicios de negocio
├── utils/           # Utilidades
│   ├── logger.ts
│   └── email.ts
├── types/           # Tipos TypeScript
│   └── index.ts
└── server.ts        # Servidor principal
```

## 🔐 Autenticación

La API utiliza JWT (JSON Web Tokens) para la autenticación. Incluye:

- **Access Token**: Válido por 24 horas
- **Refresh Token**: Válido por 7 días
- **Roles**: TL_MAYOR, PSYCHOLOGIST, STUDENT

### Endpoints de Autenticación

- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/refresh-token` - Renovar token
- `GET /api/auth/profile` - Obtener perfil
- `PUT /api/auth/profile` - Actualizar perfil
- `POST /api/auth/change-password` - Cambiar contraseña

## 📊 Endpoints Principales

### Usuarios

- `GET /api/users` - Listar usuarios (TL Mayor)
- `GET /api/users/:id` - Obtener usuario
- `POST /api/users` - Crear usuario (TL Mayor)
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario (TL Mayor)

### Citas

- `GET /api/appointments` - Listar citas (TL Mayor)
- `GET /api/appointments/my-appointments` - Mis citas
- `POST /api/appointments` - Crear cita
- `GET /api/appointments/:id` - Obtener cita
- `PUT /api/appointments/:id` - Actualizar cita
- `PUT /api/appointments/:id/cancel` - Cancelar cita
- `PUT /api/appointments/:id/complete` - Completar cita

### Mensajes

- `GET /api/messages/conversations` - Mis conversaciones
- `POST /api/messages` - Enviar mensaje
- `GET /api/messages/:id` - Obtener mensaje
- `PUT /api/messages/:id/read` - Marcar como leído

### Perfiles

- `GET /api/profiles/psychologists` - Listar psicólogos
- `POST /api/profiles/psychologists` - Crear perfil psicólogo
- `GET /api/profiles/students` - Listar estudiantes
- `POST /api/profiles/students` - Crear perfil estudiante

### Blog

- `GET /api/profiles/blog-posts` - Listar posts
- `POST /api/profiles/blog-posts` - Crear post
- `GET /api/profiles/blog-posts/:id` - Obtener post
- `PUT /api/profiles/blog-posts/:id` - Actualizar post
- `DELETE /api/profiles/blog-posts/:id` - Eliminar post

## 🔒 Seguridad

- **Rate Limiting**: Límites por IP y endpoint
- **CORS**: Configurado para dominios específicos
- **Helmet**: Headers de seguridad
- **Validación**: Todos los inputs son validados
- **Sanitización**: Datos limpiados antes de procesar
- **Logging**: Registro de todas las operaciones

## 📝 Logging

El sistema incluye logging completo con Winston:

- **Console**: Logs en consola (desarrollo)
- **Files**: Logs en archivos (producción)
- **Levels**: error, warn, info, http, debug
- **Rotación**: Archivos rotan automáticamente

## 🧪 Testing

```bash
# Ejecutar tests
npm test

# Tests con coverage
npm run test:coverage
```

## 🚀 Despliegue

### Docker

```bash
# Construir imagen
docker build -t speaktome-backend .

# Ejecutar contenedor
docker run -p 3000:3000 speaktome-backend
```

### Variables de Entorno de Producción

```env
NODE_ENV=production
PORT=3000
DB_HOST=tu_host_mysql
DB_NAME=speaktome_db
JWT_SECRET=secreto_super_seguro
```

## 📈 Monitoreo

- **Health Check**: `GET /api/health`
- **Info API**: `GET /api/info`
- **Logs**: Directorio `logs/`
- **Métricas**: Disponibles en endpoints específicos

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Universidad RIWI** - Desarrollo y mantenimiento
- **Equipo de Desarrollo** - Implementación técnica

## 📞 Soporte

Para soporte técnico o preguntas:

- **Email**: soporte@riwi.edu
- **Documentación**: `/api/info`
- **Issues**: GitHub Issues

---

**SpeakToMe** - Conectando mentes, sanando corazones 💙
