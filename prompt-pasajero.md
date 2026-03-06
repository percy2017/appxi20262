# Documentación: WebApp Pasajero - Integración con Backend

Este documento describe cómo el **WebApp del Pasajero** (OnsenUI + React) debe comunicarse con el **Backend** del sistema MotoTaxi.

---

## Configuración Base

```javascript
// Configuración del Backend
const API_BASE = 'http://tu-servidor:3000';
// Las APIs están bajo /admin/api/
```

---

## 1. AUTH - Autenticación del Pasajero

### Login con WhatsApp (Automático)

El pasajero solo ingresa su número de teléfono. El backend:
1. Obtiene datos reales del perfil de WhatsApp (nombre, foto)
2. Descarga la foto de perfil y la guarda localmente
3. Crea/actualiza el pasajero en la base de datos

**Endpoint:**
```
POST /admin/api/auth/login-whatsapp
```

**Request:**
```json
{
    "phone": "78746621"
}
```

**Response (éxito):**
```json
{
    "success": true,
    "message": "Pasajero autenticado correctamente",
    "data": {
        "id": 1,
        "nombre": "Mary",
        "telefono": "59178746621",
        "avatar": "/images/pasajeros/pasajero_59178746621_1772693261572.jpg"
    }
}
```

**Response (error):**
```json
{
    "success": false,
    "message": "El teléfono es requerido"
}
```

### Implementación en el WebApp

```javascript
async function registerOrLoginUser(phoneNumber) {
    try {
        const response = await fetch(`${API_BASE}/admin/api/auth/login-whatsapp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                phone: phoneNumber
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Guardar ID del pasajero para futuras solicitudes
            localStorage.setItem('pasajero_id', data.data.id);
            localStorage.setItem('pasajero_nombre', data.data.nombre);
            localStorage.setItem('pasajero_avatar', data.data.avatar);
            return data;
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
```

---

## 2. VIAJES - Solicitar un Viaje

### Crear Solicitud de Viaje

**IMPORTANTE:** El WebApp solo envía coordenadas. El backend se encarga de:
- Obtener las direcciones desde las coordenadas (Nominatim/OpenStreetMap)
- Calcular la distancia
- Calcular el precio

**Endpoint:**
```
POST /admin/api/viajes/solicitar
```

**Request (solo coordenadas + método de pago):**
```json
{
    "pasajero_id": 1,
    "origen_lat": -14.8333,
    "origen_lng": -64.9000,
    "destino_lat": -14.8350,
    "destino_lng": -64.9050,
    "metodo_pago": "efectivo"
}
```

**Response (éxito):**
```json
{
    "success": true,
    "message": "Viaje publicado. Esperando ofertas de choferes...",
    "data": {
        "id": 1,
        "pasajero_id": 1,
        "origen_direccion": "Calle Carmelo López, Trinidad, Beni",
        "destino_direccion": "Calle Nicolás Suárez, Trinidad, Beni",
        "distancia": 1.04,
        "duracion_estimada": 2,
        "precio_referencial": 14.12,
        "metodo_pago": "efectivo",
        "estado": "buscando",
        "tiempo_espera_max": 60
    }
}
```

### Recibir Notificaciones del Viaje (Socket.io)

El WebApp debe escuchar los siguientes eventos de Socket.io para actualizar el estado del viaje en tiempo real:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://tu-servidor:3000');

// Unirse a la sala del pasajero
socket.emit('join_room', { pasajero_id: 1 });

// Escuchar: Viaje aceptado por un chofer
socket.on('viaje_aceptado', (data) => {
    console.log('Viaje aceptado:', data);
    // Mostrar info del chofer: nombre, teléfono, tiempo de llegada
});

// Escuchar: Ubicación del chofer (tracking)
socket.on('ubicacion_piloto', (data) => {
    console.log('Ubicación chofer:', data.latitud, data.longitud);
    // Actualizar marcador en el mapa
});

// Escuchar: Viaje iniciado
socket.on('viaje_iniciado', (data) => {
    console.log('Viaje iniciado');
    // Mostrar计时器 de viaje
});

// Escuchar: Viaje completado
socket.on('viaje_completado', (data) => {
    console.log('Viaje completado');
    // Mostrar resumen del viaje, precio final
});

// Escuchar: Viaje cancelado
socket.on('viaje_cancelado', (data) => {
    console.log('Viaje cancelado:', data.motivo);
    // Mostrar mensaje de cancelación
});

// Escuchar: Sin choferes disponibles
socket.on('sin_choferes', (data) => {
    console.log('Sin choferes:', data.mensaje);
    alert('No hay choferes disponibles. Te notificaremos cuando alguno se conecte.');
});

// Escuchar: Oferta de chofer
socket.on('oferta_aceptada', (data) => {
    console.log('Oferta recibida:', data);
    // Mostrar opción de confirmar viaje
    // data.precio_acordado
    // data.piloto_id
});
```

### Obtener Estado de un Viaje

**Endpoint:**
```
GET /admin/api/viajes/{id}
```

**Response:**
```json
{
    "success": true,
    "data": {
        "id": 1,
        "estado": "aceptado",
        "piloto": {
            "id": 2,
            "nombre": "Carlos López",
            "telefono": "+59176543211",
            "placa": "ABC-123"
        }
    }
}
```

---

## 3. RESEÑAS - Comentarios y Reseñas

### Crear Reseña de un Viaje

**Endpoint:**
```
POST /admin/api/resenas
```

**Request:**
```json
{
    "viaje_id": 1,
    "pasajero_id": 1,
    "piloto_id": 2,
    "calificacion": 5,
    "comentario": "Excelente servicio, muy puntuales"
}
```

**Response:**
```json
{
    "success": true,
    "message": "Reseña guardada correctamente"
}
```

### Obtener Historial de Viajes

**Endpoint:**
```
GET /admin/api/pasajero/{id}/viajes
```

**Response:**
```json
{
    "success": true,
    "data": [
        {
            "id": 1,
            "origen_direccion": "Av. Montenegro",
            "destino_direccion": "C. Campos",
            "precio": 25.00,
            "estado": "completado",
            "fecha_solicitud": "2026-03-05T12:00:00.000Z",
            "piloto": {
                "nombre": "Carlos López"
            }
        }
    ]
}
```

---

## Códigos de Estado de Viaje

| Estado | Descripción |
|--------|-------------|
| `pendiente` | Viaje solicitado, esperando que un chofer lo acepte |
| `aceptado` | Un chofer aceptó el viaje |
| `iniciado` | El chofer inició el viaje |
| `completado` | El viaje finished successfully |
| `cancelado` | El viaje fue cancelado |

---

## Manejo de Errores

### Códigos de Error HTTP

| Código | Significado |
|--------|-------------|
| 200 | Éxito |
| 400 | Datos inválidos |
| 401 | No autenticado |
| 404 | Recurso no encontrado |
| 500 | Error del servidor |

### Ejemplo de Manejo de Errores

```javascript
async function hacerSolicitud(endpoint, data, token) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!result.success) {
            // Mostrar mensaje de error
            alert(result.message);
            return null;
        }
        
        return result;
    } catch (error) {
        console.error('Error de red:', error);
        alert('Error de conexión. Verifica tu internet.');
    }
}
```

---

## Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/admin/api/auth/login-whatsapp` | Login con WhatsApp (datos reales + foto) |
| POST | `/admin/api/viajes/solicitar` | Solicitar viaje (coordenadas + método pago) |
| GET | `/admin/api/viajes/{id}` | Obtener estado de viaje |
| POST | `/admin/api/viajes/{id}/confirmar` | Pasajero confirma viaje con chofer |
| GET | `/admin/api/pasajero/{id}/viajes` | Historial de viajes |
| POST | `/admin/api/resenas` | Crear reseña |
| Socket | `join_room` | Unirse a sala de notificaciones |
| Socket | `nueva_solicitud` | Recibir nuevas solicitudes de viaje |
| Socket | `oferta_aceptada` | Notificación de oferta de chofer |
| Socket | `viaje_confirmado` | Viaje confirmado por pasajero |
