# Prompt: Sistema de Gestión para Servicio de Mototaxi

**Rol:** Eres un Desarrollador Full Stack Senior especializado en Node.js, Express (ES6), aplicaciones en Tiempo Real y mapas interactivos.

---

## Contexto del Proyecto

Vamos a desarrollar una plataforma de transporte tipo **Mototaxi** composta por 4 secciones web:

1. **Landing Page (`/`):** Página pública de inicio.
2. **Dashboard Admin (`/admin`):** Panel de control para gestionar mototaxis, pilotos, pasajeros y viajes.
3. **WebApp Pasajero:** Aplicación para solicitar viajes.
4. **WebApp Chofer:** Aplicación para aceptar y gestionar viajes.

---

## Stack Tecnológico (Obligatorio)

* **Backend:** Node.js con Express (**ES6 Modules** `import`/`export`).
* **Herramienta de Desarrollo:** **Nodemon** (`nodemon ./bin/www`).
* **Scaffolding:** Express Generator (`npx express-generator --view=ejs`).
* **Motor de Plantillas:** EJS.
* **Base de Datos:** SQLite (`better-sqlite3`).
* **Sesiones:** express-session.
* **Frontend UI:**
  * **Admin:** Bootstrap 5.0 (Plantilla "Dashboard").
  * **Pasajero/Chofer:** **OnsenUI + React**.
* **Mapas:** Leaflet.js (OpenStreetMap).
* **Tablas:** DataTables.js.
* **Alertas:** SweetAlert2.
* **Tiempo Real:** Socket.io.
* **Integración WhatsApp:** Evolution API.
* **Plantilla Admin:** https://getbootstrap.com/docs/5.0/examples/dashboard/

---

## Estructura del Proyecto

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
│   │   └── pasajeros/        # Fotos de pasajeros
│   └── img/
├── src/
│   ├── config/
│   │   ├── database.js       # Conexión a SQLite
│   │   └── socket.js         # Configuración de Socket.io
│   ├── database/
│   │   └── init.js           # Script para crear tablas
│   ├── controllers/
│   │   ├── adminController.js      # Dashboard admin
│   │   ├── authController.js       # Autenticación de admin
│   │   ├── usuarioController.js    # Gestión de usuarios
│   │   ├── pasajeroController.js  # Gestión de pasajeros (admin)
│   │   ├── pasajeroApiController.js # APIs de viajes y reseñas
│   │   └── evolutionController.js  # Integración Evolution API
│   └── models/
│       ├── usuarioModel.js
│       ├── pilotoModel.js
│       ├── pasajeroModel.js
│       └── viajeModel.js
├── routes/
│   ├── index.js              # Rutas landing page
│   ├── admin.js             # Rutas del admin
│   └── evolution.js          # Rutas de Evolution API y autenticación
├── views/
│   ├── layouts/
│   │   ├── header.ejs        # Header público
│   │   ├── footer.ejs        # Footer público
│   │   └── admin-layout.ejs  # Layout del admin con sidebar
│   ├── index.ejs             # Landing Page
│   ├── admin/
│   │   ├── login.ejs         # Página de login
│   │   ├── dashboard.ejs     # Dashboard principal
│   │   ├── usuarios.ejs      # Gestión de usuarios
│   │   ├── pilotos.ejs       # Gestión de pilotos
│   │   ├── pasajeros.ejs      # Gestión de pasajeros
│   │   ├── viajes.ejs        # Gestión de viajes (tiempo real)
│   │   ├── evolution.ejs      # Vista de instancias Evolution API
│   │   └── socket-monitor.ejs # Monitoreo de sockets
│   └── error.ejs
├── app.js                    # Configuración principal
├── package.json
├── .env                     # Variables de entorno
└── prompt.md                 # Documentación del proyecto
```

---

## Rutas del Proyecto

| Ruta | Descripción | UI Framework |
|------|-------------|--------------|
| `/` | Landing Page | Bootstrap |
| `/admin/login` | Login de Admin | Bootstrap 5.0 |
| `/admin/logout` | Cerrar sesión | - |
| `/admin` | Dashboard Admin | Bootstrap 5.0 + DataTables |
| `/admin/usuarios` | Gestión de Usuarios | Bootstrap 5.0 + DataTables |
| `/admin/pilotos` | Gestión de Pilotos | Bootstrap 5.0 + DataTables |
| `/admin/pasajeros` | Gestión de Pasajeros | Bootstrap 5.0 + DataTables |
| `/admin/viajes` | Gestión de Viajes | Bootstrap 5.0 + DataTables + Socket.io |
| `/admin/evolution` | Instancias Evolution API | Bootstrap 5.0 |
| `/admin/socket-monitor` | Monitoreo de Sockets | Bootstrap 5.0 |

---

## API REST del Sistema

### Autenticación (Admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/login` | Página de login |
| POST | `/admin/login` | Procesar login |
| GET | `/admin/logout` | Cerrar sesión |

### Autenticación (Evolution API)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/evolution` | Vista de instancias de WhatsApp |
| GET | `/api/evolution/instances` | Lista de instancias disponibles |
| POST | `/api/evolution/set-default` | Guardar instancia por defecto |
| GET | `/api/evolution/default-instance` | Obtener instancia por defecto |
| POST | `/api/auth/solicitar-pin` | Enviar PIN de verificación por WhatsApp |
| POST | `/api/auth/verificar-pin` | Verificar PIN y autenticar usuario |
| POST | `/api/auth/login-whatsapp` | Login/registro legacy de pasajero |

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
| PATCH | `/admin/api/pilotos/:id/estado` | Actualizar estado del piloto |

### Admin - Pasajeros

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/api/pasajeros` | Listar pasajeros |
| POST | `/admin/api/pasajeros` | Crear pasajero |
| PUT | `/admin/api/pasajeros/:id` | Actualizar pasajero |
| DELETE | `/admin/api/pasajeros/:id` | Eliminar pasajero |

### Admin - Viajes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/admin/api/viajes` | Listar viajes |
| POST | `/admin/api/viajes/:id/cancelar` | Cancelar viaje |
| POST | `/admin/api/viajes/:id/completar` | Completar viaje |

### WebApp Pasajero - Viajes

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/admin/api/auth/login-whatsapp` | Login/registro con WhatsApp (obtiene datos reales y foto) |
| POST | `/admin/api/viajes/solicitar` | Solicitar nuevo viaje (solo coordenadas + método pago) |
| GET | `/admin/api/viajes/:id` | Obtener estado de viaje |
| POST | `/admin/api/viajes/:id/oferta` | Chofer hace oferta (acepta o contraoferta) |
| POST | `/admin/api/viajes/:id/confirmar` | Pasajero confirma viaje con chofer |
| GET | `/admin/api/pasajero/:id/viajes` | Historial de viajes del pasajero |
| POST | `/admin/api/resenas` | Crear reseña |

---

## Base de Datos (SQLite)

### Tablas (`src/database/init.js`)

1. **usuarios** - Usuarios del sistema (admin)
   - `id` INTEGER PRIMARY KEY
   - `username` TEXT UNIQUE NOT NULL
   - `password` TEXT NOT NULL
   - `nombre` TEXT NOT NULL
   - `email` TEXT
   - `telefono` TEXT
   - `avatar` TEXT
   - `rol` TEXT DEFAULT 'administrador' (administrador, chofer, pasajero)
   - `created_at` DATETIME
   - `updated_at` DATETIME

2. **pilotos** - Pilotos de mototaxi
   - `id` INTEGER PRIMARY KEY
   - `nombre` TEXT NOT NULL
   - `apellido` TEXT
   - `telefono` TEXT NOT NULL
   - `licencia` TEXT UNIQUE NOT NULL
   - `placa` TEXT UNIQUE NOT NULL
   - `modelo` TEXT
   - `color` TEXT
   - `foto` TEXT
   - `foto_vehiculo` TEXT
   - `estado` TEXT DEFAULT 'disponible' (disponible, ocupado, inactivo)
   - `latitud` REAL
   - `longitud` REAL
   - `created_at` DATETIME
   - `updated_at` DATETIME

3. **pasajeros** - Pasajeros registrados (desde WebApp)
   - `id` INTEGER PRIMARY KEY
   - `nombre` TEXT NOT NULL
   - `telefono` TEXT NOT NULL
   - `email` TEXT
   - `direccion` TEXT
   - `avatar` TEXT
   - `created_at` DATETIME
   - `updated_at` DATETIME

4. **viajes** - Registro de viajes
   - `id` INTEGER PRIMARY KEY
   - `pasajero_id` INTEGER
   - `piloto_id` INTEGER
   - `origen_direccion` TEXT NOT NULL
   - `origen_lat` REAL NOT NULL
   - `origen_lng` REAL NOT NULL
   - `destino_direccion` TEXT NOT NULL
   - `destino_lat` REAL NOT NULL
   - `destino_lng` REAL NOT NULL
   - `distancia` REAL
   - `precio` REAL
   - `estado` TEXT DEFAULT 'pendiente' (pendiente, aceptado, iniciado, completado, cancelado)
   - `fecha_solicitud` DATETIME
   - `fecha_inicio` DATETIME
   - `fecha_fin` DATETIME
   - FOREIGN KEY (pasajero_id) REFERENCES pasajeros(id)
   - FOREIGN KEY (piloto_id) REFERENCES pilotos(id)

5. **resenas** - Reseñas de viajes
   - `id` INTEGER PRIMARY KEY
   - `viaje_id` INTEGER NOT NULL
   - `pasajero_id` INTEGER NOT NULL
   - `piloto_id` INTEGER NOT NULL
   - `calificacion` INTEGER NOT NULL (1-5)
   - `comentario` TEXT
   - `created_at` DATETIME
   - FOREIGN KEY (viaje_id) REFERENCES viajes(id)
   - FOREIGN KEY (pasajero_id) REFERENCES pasajeros(id)
   - FOREIGN KEY (piloto_id) REFERENCES pilotos(id)

---

## Integración con Evolution API

### Configuración

Las variables de entorno necesarias están en `.env`:
```
EVOLUTION_API_URL=http://217.216.43.75:2001
EVOLUTION_API_TOKEN=evolution2001
```

### Flujo de Autenticación

1. **WebApp Pasajero** → `POST /admin/api/auth/login-whatsapp` con número de teléfono
2. **Backend** → Consulta Evolution API para obtener datos del perfil (nombre, foto)
3. **Backend** → Descarga foto de perfil y guarda en `/public/images/pasajeros/`
4. **Backend** → Crea/actualiza pasajero en SQLite y retorna datos

**Auto-detección:** Si no se especifica una instancia, el sistema usa automáticamente la primera instancia disponible con estado "open".

---

## Geocodificación (Nominatim/OpenStreetMap)

### Conversión de Coordenadas a Direcciones

El backend convierte coordenadas (lat/lng) a direcciones legibles usando Nominatim:

**Flujo:**
```
WebApp (coordenadas) → Backend → Nominatim API → Dirección
```

**Request (solo coordenadas):**
```json
{
    "pasajero_id": 1,
    "origen_lat": -14.8333,
    "origen_lng": -64.9000,
    "destino_lat": -14.8350,
    "destino_lng": -64.9050
}
```

**El backend calcula:**
- Dirección origen (geocodificación inversa)
- Dirección destino (geocodificación inversa)
- Distancia en km (fórmula Haversine)
- Precio estimado (5 Bs por km, mínimo 5 Bs)

---

## Sistema de Layouts

### Layout Admin (`views/layouts/admin-layout.ejs`)
- Header con navegación
- Sidebar con menú de navegación
- Sistema de renderizado con `res.renderWithLayout()`
- Carga de librerías: jQuery, Bootstrap 5, DataTables, Socket.io, SweetAlert2

### Menú del Sidebar
- Panel (Dashboard)
- Viajes
- Choferes (Pilotos)
- Pasajeros
- Usuarios
- Sockets (Monitoreo)
- Evolution (Instancias WhatsApp)

---

## Vistas del Admin

### Evolution (`/admin/evolution`)
- Muestra las instancias disponibles de Evolution API
- Tabla con: Nombre, Estado, Dueño, Perfil
- Radio button para seleccionar instancia por defecto
- Auto-detección de instancia "open"

### Viajes (`/admin/viajes`)
- Tabla con DataTables con carga AJAX
- **Actualización en tiempo real** via Socket.io
- Notificaciones Toast cuando hay cambios

---

## Socket.io - Eventos

### Eventos del Cliente (WebApp Pasajero/Chofer)
- `join_room` - Unirse a una sala
- `solicitar_viaje` - Solicitar un viaje
- `aceptar_viaje` - Aceptar un viaje
- `actualizar_ubicacion` - Actualizar ubicación
- `iniciar_viaje` - Iniciar viaje
- `completar_viaje` - Completar viaje
- `cancelar_viaje` - Cancelar viaje

### Eventos del Servidor
- `nueva_solicitud` - Nueva solicitud de viaje (a choferes)
- `sin_choferes` - No hay choferes disponibles (a pasajero)
- `oferta_aceptada` - Un chofer aceptó el viaje (a pasajero)
- `viaje_confirmado` - Pasajero confirmó el viaje (a chofer)
- `ubicacion_piloto` - Ubicación del piloto
- `viaje_iniciado` - Viaje iniciado
- `viaje_completado` - Viaje completado
- `viaje_cancelado` - Viaje cancelado
- `viaje_actualizado` - Viaje actualizado (admin)
- `socket_event` - Evento de monitoreo (admin)

---

## Sistema de Notificaciones (WebApp + WhatsApp)

El sistema envía notificaciones por dos canales:
1. **WebApp:** Socket.io en tiempo real
2. **WhatsApp:** Evolution API para mensajes

### Flujo de Notificaciones:

| Evento | WebApp (Socket) | WhatsApp |
|--------|-----------------|----------|
| Nueva solicitud | ✅ Sala `pilotos` | ✅ A todos los pilotos |
| Sin choferes | ✅ Pasajero | ✅ Pasajero |
| Chofer acepta | ✅ Pasajero | ✅ Pasajero |
| Pasajero confirma | ✅ Chofer | ✅ Chofer |
| Viaje iniciado | ✅ Pasajero | ✅ Pasajero |
| Viaje completado | ✅ Pasajero | ✅ Pasajero |

---

## Sistema de Autenticación

### Descripción
El panel de administración (`/admin`) está protegido por un sistema de autenticación basado en sesiones.

### Configuración
- **Middleware:** `express-session` para manejo de sesiones
- **Sesión:** 24 horas de duración
- **Protección:** Todas las rutas de `/admin` requieren autenticación (excepto `/admin/login`)

### Credenciales por Defecto
El sistema crea un usuario administrador por defecto al inicializar la base de datos:
- **Usuario:** `admin`
- **Contraseña:** `admin123`

### Middleware de Autenticación
- `requireAuth()` - Verifica que el usuario esté autenticado
- `requireAdmin()` - Verifica que el usuario tenga rol de administrador

### Variables de Sesión
```javascript
req.session.usuario = {
    id: Number,
    username: String,
    nombre: String,
    email: String,
    rol: String  // 'administrador', 'chofer', 'pasajero'
}
```

### Vistas
- `views/admin/login.ejs` - Página de login
- `views/layouts/admin-layout.ejs` - Layout con header que muestra usuario y botón logout

### Controlador
- `src/controllers/authController.js` - Funciones de login, logout y middleware

---

## Estándares de Código

1. **Estructura Modular:** Cada módulo/controlador/ruta en su propio archivo.
2. **Código Limpio:** Nombres descriptivos (consistente en español o inglés).
3. **Comentarios:** Cada función importante con comentario explicativo.
4. **Separación de Responsabilidades:**
   - **Routes:** Define endpoints y llama al controlador.
   - **Controller:** Lógica de negocio (validaciones, llamadas a modelos).
   - **Model:** Consultas directas a la base de datos.
5. **Imports Explícitos:** Rutas relativas claras.
6. **IDs como números:** Siempre convertir IDs a número (`parseInt`).

---

## Comandos para Iniciar

```bash
# Instalar dependencias
npm install

# Iniciar servidor en modo desarrollo
npm run dev   # nodemon ./bin/www

# Iniciar servidor en producción
npm start     # node ./bin/www
```

---

## Archivos Principales

1. `package.json` - Dependencias y scripts
2. `bin/www` - Entry point del servidor
3. `app.js` - Configuración principal de Express (sesiones, locales)
4. `.env` - Variables de entorno
5. `src/config/database.js` - Conexión a SQLite
6. `src/config/socket.js` - Configuración de Socket.io
7. `src/database/init.js` - Inicialización de tablas
8. `src/controllers/authController.js` - Autenticación de admin
9. `src/controllers/evolutionController.js` - Controlador de Evolution API
10. `src/controllers/pasajeroController.js` - Controlador de pasajeros
11. `src/controllers/pasajeroApiController.js` - APIs de viajes y reseñas
12. `routes/evolution.js` - Rutas de Evolution y autenticación
13. `routes/admin.js` - Rutas del admin (protegidas)
14. `views/admin/login.ejs` - Página de login
15. `views/admin/evolution.ejs` - Vista de instancias Evolution API
16. `views/layouts/admin-layout.ejs` - Layout del admin

---

## RESTRICCIONES FINALES

* ✅ Usar **ES6** (`import`/`export`).
* ✅ **Nodemon** para desarrollo (`npm run dev`).
* ✅ **Express Generator** como scaffold.
* ✅ **express-session** para autenticación.
* ✅ **Leaflet** con OpenStreetMap.
* ✅ **OnsenUI + React** en Pasajero y Chofer.
* ✅ **Código comentado y modularizado**.
* ✅ **Socket.io** para tiempo real.
* ✅ **Evolution API** para WhatsApp.
* ✅ **Layout system** para admin con sidebar.
* ✅ **DataTables** para tablas interactivas.
* ✅ **SweetAlert2** para alertas.
* ✅ **Moneda configurable** desde `.env`.
* ✅ **Login/Logout** para admin.

---

## Sistema de Moneda

### Descripción
La moneda de la aplicación es configurable desde el archivo `.env`.

### Variables de Entorno
```env
MONEDA=Bs                # Símbolo de moneda (ej: Bs, $, €, etc.)
PRECIO_BASE=5           # Precio base del viaje
PRECIO_KM=3             # Precio por kilómetro
PRECIO_MINUTO=0.50      # Precio por minuto estimado
```

### Uso en la Aplicación
- **Backend:** La variable `MONEDA` está disponible en `app.locals` y se usa en controladores y mensajes de WhatsApp
- **Frontend:** Se pasa como variable global `window.MONEDA` en el layout del admin
- **UI:** El precio se muestra como `MONEDA + monto` (ej: "Bs 25.00")

### Archivos que usan MONEDA
1. `app.js` - Configuración de `app.locals.MONEDA`
2. `views/layouts/admin-layout.ejs` - Variable global JavaScript
3. `views/admin/viajes.ejs` - Mostrar precios en tablas
4. `public/js/admin/dashboard.js` - Renderizar precios en DataTables
5. `src/controllers/pasajeroApiController.js` - Mensajes de WhatsApp

---

## Sistema de Precios y Puja

### Fórmula de Precio (configurable en .env)
```
Precio = PRECIO_BASE + (distancia_km × PRECIO_KM) + (duracion_minutos × PRECIO_MINUTO)
```

**Variables de entorno (.env):**
```env
MONEDA=Bs                # Moneda: Bolivianos (BOB)
PRECIO_BASE=5            # Precio base del viaje (Bs)
PRECIO_KM=3              # Precio por kilómetro (Bs)
PRECIO_MINUTO=0.50       # Precio por minuto estimado (Bs)
TIEMPO_ESPERA_MAX=600    # Tiempo máximo de espera para ofertas (10 minutos)
OSRM_URL=https://router.project-osrm.org
SESSION_SECRET=mototaxi_secret_key_2026
```

### Flujo de Viaje (Sistema de Puja)

1. **Pasajero solicita viaje** → Envía coordenadas + método de pago (efectivo/QR)
2. **Backend calcula** → Ruta OSRM (motocicleta) + distancia + tiempo + precio referencial
3. **Backend envía** → Solicitud a choferes disponibles con precio referencial
4. **Choferes responden** → Aceptan precio O hacen contraoferta
5. **Pasajero elige** → Acepta uno de los choferes
6. **Viaje inicia** → Chofer confirma y comienza el servicio

### Estados de Viaje
| Estado | Descripción |
|--------|-------------|
| `buscando` | Esperando ofertas de choferes |
| `aceptado` | Un chofer hizo oferta, esperando confirmación |
| `iniciado` | Viaje en curso |
| `completado` | Viaje terminado |
| `cancelado` | Viaje cancelado |
