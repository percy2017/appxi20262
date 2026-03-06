# 🚕 MotoTaxi - Sistema de Gestión de Mototaxi

Sistema de transporte tipo Mototaxi con panel de administración, aplicaciones para pasajeros y choferes, y actualizaciones en tiempo real.

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tecnologías](#-tecnologías)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación](#-instalación)
- [Ejecución](#-ejecución)
- [Rutas del Proyecto](#-rutas-del-proyecto)
- [API REST](#-api-rest)
- [Socket.io - Eventos](#-socketio---eventos)
- [Base de Datos](#-base-de-datos)
- [Capturas de Pantalla](#-capturas-de-pantalla)
- [Licencia](#-licencia)

---

## 🚀 Características

### Landing Page (`/`)
- Página pública de inicio del servicio

### Dashboard Admin (`/admin`)
- Gestión de usuarios del sistema
- Gestión de pilotos/choferes
- Gestión de pasajeros
- Gestión de viajes con actualización en tiempo real
- **Monitor Socket.io** - Visualiza conexiones, canales y eventos en tiempo real

### WebApp Pasajero
- Registro/login via WhatsApp
- Solicitar viajes
- Tracking en tiempo real del piloto
- Historial de viajes
- Reseñas

### WebApp Chofer
- Recibir solicitudes de viaje
- Aceptar/rechazar viajes
- Actualizar ubicación en tiempo real
- Iniciar/completar/cancelar viajes

---

## 💻 Tecnologías

| Categoría | Tecnología |
|-----------|------------|
| Backend | Node.js + Express (ES6 Modules) |
| Base de Datos | SQLite (`better-sqlite3`) |
| Motor de Plantillas | EJS |
| Frontend Admin | Bootstrap 5.0 + DataTables |
| Frontend Pasajero/Chofer | OnsenUI + React |
| Mapas | Leaflet.js (OpenStreetMap) |
| Tiempo Real | Socket.io |
| Alertas | SweetAlert2 |
| Desarrollo | Nodemon |

---

## 📁 Estructura del Proyecto

```
mototaxi-app/
├── bin/
│   └── www                    # Entry point del servidor
├── public/
│   ├── css/
│   │   ├── admin/
│   │   │   └── admin.css     # Estilos del admin
│   │   └── custom.css
│   ├── js/
│   │   ├── admin/
│   │   │   └── dashboard.js
│   │   └── socket-client.js  # Cliente Socket.io
│   ├── images/
│   └── img/
├── src/
│   ├── config/
│   │   ├── database.js       # Conexión a SQLite
│   │   └── socket.js         # Configuración de Socket.io
│   ├── database/
│   │   └── init.js           # Script para crear tablas
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── usuarioController.js
│   │   └── pasajeroController.js
│   └── models/
│       ├── usuarioModel.js
│       ├── pilotoModel.js
│       ├── pasajeroModel.js
│       └── viajeModel.js
├── routes/
│   ├── index.js              # Rutas landing page
│   └── admin.js              # /admin (incluye API REST)
├── views/
│   ├── layouts/
│   │   ├── header.ejs        # Header público
│   │   ├── footer.ejs        # Footer público
│   │   └── admin-layout.ejs  # Layout del admin con sidebar
│   ├── index.ejs             # Landing Page
│   ├── admin/
│   │   ├── dashboard.ejs     # Dashboard principal
│   │   ├── usuarios.ejs      # Gestión de usuarios
│   │   ├── pilotos.ejs       # Gestión de pilotos
│   │   ├── pasajeros.ejs     # Gestión de pasajeros
│   │   ├── viajes.ejs        # Gestión de viajes
│   │   └── socket-monitor.ejs # Monitor de Socket.io
│   └── error.ejs
├── app.js                    # Configuración principal
├── package.json
├── .env
└── README.md
```

---

## ⚙️ Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd mototaxi-app

# Instalar dependencias
npm install
```

---

## ▶️ Ejecución

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor se ejecutará en: **http://localhost:3000**

---

## 🛣️ Rutas del Proyecto

| Ruta | Descripción |
|------|-------------|
| `/` | Landing Page |
| `/admin` | Dashboard Admin |
| `/admin/usuarios` | Gestión de Usuarios |
| `/admin/pilotos` | Gestión de Pilotos |
| `/admin/pasajeros` | Gestión de Pasajeros |
| `/admin/viajes` | Gestión de Viajes |
| `/admin/socket-monitor` | Monitor Socket.io |

---

## 🔌 API REST

### Admin - Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/api/usuarios` | Listar usuarios |
| POST | `/admin/api/usuarios` | Crear usuario |
| PUT | `/admin/api/usuarios/:id` | Actualizar usuario |
| DELETE | `/admin/api/usuarios/:id` | Eliminar usuario |

### Admin - Pilotos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/api/pilotos` | Listar pilotos |
| POST | `/admin/api/pilotos` | Crear piloto |
| PUT | `/admin/api/pilotos/:id` | Actualizar piloto |
| DELETE | `/admin/api/pilotos/:id` | Eliminar piloto |

### Admin - Viajes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/api/viajes` | Listar viajes |
| POST | `/admin/api/viajes/:id/cancelar` | Cancelar viaje |
| POST | `/admin/api/viajes/:id/completar` | Completar viaje |

### WebApp Pasajero

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login-whatsapp` | Login/registro de pasajero |
| POST | `/api/viajes/solicitar` | Solicitar viaje |
| GET | `/api/viajes/:id` | Obtener estado de viaje |
| GET | `/api/pasajero/:id/viajes` | Historial de viajes |
| POST | `/api/resenas` | Crear reseña |

---

## 📡 Socket.io - Eventos

### Eventos del Cliente

| Evento | Descripción |
|--------|-------------|
| `join_room` | Unirse a una sala |
| `solicitar_viaje` | Solicitar un viaje |
| `aceptar_viaje` | Aceptar un viaje |
| `actualizar_ubicacion` | Actualizar ubicación |
| `iniciar_viaje` | Iniciar viaje |
| `completar_viaje` | Completar viaje |
| `cancelar_viaje` | Cancelar viaje |

### Eventos del Servidor

| Evento | Descripción |
|--------|-------------|
| `nueva_solicitud` | Nueva solicitud de viaje |
| `viaje_aceptado` | Viaje aceptado |
| `ubicacion_piloto` | Ubicación del piloto |
| `viaje_iniciado` | Viaje iniciado |
| `viaje_completado` | Viaje completado |
| `viaje_cancelado` | Viaje cancelado |
| `viaje_actualizado` | Viaje actualizado (admin) |
| `socket_event` | Evento de monitoreo |

### Salas (Rooms)

| Sala | Descripción |
|------|-------------|
| `admin` | Panel de administración |
| `pilotos` | Todos los choferes conectados |
| `pasajero_{id}` | Sala privada de un pasajero |
| `monitor` | Monitor de Socket.io |

---

## 🗄️ Base de Datos

### Tablas

1. **usuarios** - Usuarios del sistema (admin)
2. **pilotos** - Pilotos de mototaxi
3. **pasajeros** - Pasajeros registrados
4. **viajes** - Registro de viajes

---

## 🖥️ Monitor Socket.io

El panel de administración incluye un **Monitor Socket.io** que muestra:

- **Conexiones activas** - Número de clientes conectados
- **Canales/Salas** - Lista de salas activas con número de clientes
- **Log de eventos** - Eventos entrantes y salientes en tiempo real
- **Estadísticas** - Total de conexiones y desconexiones

Acceder en: `/admin/socket-monitor`

---

## 📸 Capturas de Pantalla

*(Agregar capturas de pantalla aquí)*

---

## 📄 Licencia

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 👤 Autor

Desarrollado por [Tu Nombre]

---

<div align="center">
  <p>⭐ Dale una estrella si te gusta el proyecto!</p>
</div>
