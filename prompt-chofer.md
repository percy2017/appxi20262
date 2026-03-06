# Documentación: WebApp Chofer - Integración con Backend

Este documento describe cómo el **WebApp del Chofer** (OnsenUI + React) debe comunicarse con el **Backend** del sistema MotoTaxi.

---

## Configuración Base

```javascript
// Configuración del Backend
const API_BASE = 'http://tu-servidor:3000';
// Las APIs están bajo /admin/api/
```

---

## Flujo de Trabajo del Chofer

```
1. Conectarse a la app (Socket.io)
   ↓
2. Recibir nuevas solicitudes de viaje (WebApp + WhatsApp)
   ↓
3. Aceptar viaje (precio referencial) o hacer contraoferta
   ↓
4. Esperar confirmación del pasajero
   ↓
5. Iniciar viaje → Recoger pasajero
   ↓
6. Completar viaje → Finalizar servicio
```

---

## 1. CONEXIÓN - Socket.io

### Conectar y Recibir Solicitudes

```javascript
import { io } from 'socket.io-client';

const socket = io('http://tu-servidor:3000');

// Unirse a la sala de pilotos para recibir solicitudes
socket.emit('join_room', 'pilotos');

// Escuchar: Nueva solicitud de viaje
socket.on('nueva_solicitud', (data) => {
    console.log('Nueva solicitud de viaje:', data);
    // Mostrar notificación al chofer
    // data.precio_referencial
    // data.origen_direccion
    // data.destino_direccion
    // data.distancia_km
    // data.duracion_minutos
    // data.metodo_pago
});

// Escuchar: Viaje confirmado por pasajero
socket.on('viaje_confirmado', (data) => {
    console.log('Viaje confirmado:', data);
    // Mostrar datos del pasajero
    // data.pasajero_nombre
    // data.origen_direccion
    // data.destino_direccion
});
```

---

## 2. ACEPTAR OFERTA - Aceptar/CotrarPrecio

### Aceptar precio referencial o hacer contraoferta

**Endpoint:**
```
POST /admin/api/viajes/:id/oferta
```

**Request:**
```json
{
    "piloto_id": 1,
    "precio_ofrecido": 14.12
}
```

**Nota:** El chofer puede:
- **Aceptar el precio referencial:** Enviar el mismo valor
- **Hacer contraoferta:** Enviar un precio diferente

**Response (éxito):**
```json
{
    "success": true,
    "message": "Oferta enviada al pasajero",
    "data": {
        "viaje_id": 1,
        "precio_ofrecido": 14.12,
        "estado": "aceptado"
    }
}
```

---

## 3. INICIAR VIAJE - Cuando llega al origen

### Marcar viaje como iniciado

**Endpoint:**
```
POST /admin/api/viajes/:id/iniciar
```

**Request:**
```json
{
    "piloto_id": 1
}
```

**Response:**
```json
{
    "success": true,
    "message": "Viaje iniciado",
    "data": {
        "id": 1,
        "estado": "iniciado",
        "fecha_inicio": "2026-03-05 07:30:00"
    }
}
```

---

## 4. COMPLETAR VIAJE - Cuando llega al destino

### Finalizar el viaje

**Endpoint:**
```
POST /admin/api/viajes/:id/completar
```

**Request:**
```json
{
    "piloto_id": 1
}
```

**Response:**
```json
{
    "success": true,
    "message": "Viaje completado",
    "data": {
        "id": 1,
        "estado": "completado",
        "precio": 14.12,
        "fecha_fin": "2026-03-05 07:35:00"
    }
}
```

---

## 5. ACTUALIZAR UBICACIÓN - GPS en tiempo real

### Enviar ubicación al servidor

**Socket Event:**
```javascript
// Enviar ubicación cada 5 segundos
socket.emit('actualizar_ubicacion', {
    piloto_id: 1,
    latitud: -14.8333,
    longitud: -64.9000
});
```

**El pasajero recibe:**
```javascript
socket.on('ubicacion_piloto', (data) => {
    // Actualizar marcador en el mapa
    // data.latitud
    // data.longitud
});
```

---

## 6. CANCELAR VIAJE - Cancelar en curso

### Cancelar un viaje

**Endpoint:**
```
POST /admin/api/viajes/:id/cancelar
```

**Request:**
```json
{
    "piloto_id": 1,
    "motivo": "El pasajero no apareció"
}
```

---

## Notificaciones WhatsApp

El chofer recibe notificaciones por WhatsApp cuando:

1. **Nueva solicitud de viaje** - Con detalles del origen, destino y precio
2. **Viaje confirmado** - Cuando el pasajero confirma

### Ejemplo de mensaje WhatsApp:
```
🚗 *Appxi - Nueva Solicitud de Viaje*

📍 *Origen:* Calle Carmelo López, Trinidad
🏁 *Destino:* Calle Nicolás Suárez, Trinidad
📏 *Distancia:* 1.04 km
⏱️ *Tiempo:* 2 min
💰 *Precio:* 14.12 Bs
💵 *Pago:* efectivo

¡Acepta este viaje en la app!
```

---

## Estados de Viaje (desde el chofer)

| Estado | Descripción |
|--------|-------------|
| `buscando` | Viaje publicado, esperando que un chofer acepte |
| `aceptado` | Un chofer hizo oferta, esperando confirmación del pasajero |
| `iniciado` | El chofer confirmó inicio (está en camino) |
| `completado` | Viaje terminado exitosamente |
| `cancelado` | Viaje cancelado |

---

## Resumen de Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/admin/api/viajes/:id/oferta` | Aceptar o contraofertar precio |
| POST | `/admin/api/viajes/:id/iniciar` | Marcar viaje como iniciado |
| POST | `/admin/api/viajes/:id/completar` | Completar viaje |
| POST | `/admin/api/viajes/:id/cancelar` | Cancelar viaje |
| Socket | `join_room` | Unirse a sala de pilotos |
| Socket | `nueva_solicitud` | Recibir solicitudes de viaje |
| Socket | `viaje_confirmado` | Notificación de pasajero confirmado |
| Socket | `ubicacion_piloto` | Recibir ubicación (opcional) |

---

## Ejemplo Completo - Flujo del Chofer

```javascript
// 1. Conectar
const socket = io('http://tu-servidor:3000');
socket.emit('join_room', 'pilotos');

// 2. Recibir solicitud
socket.on('nueva_solicitud', async (data) => {
    // Mostrar modal con detalles del viaje
    const aceptar = confirm(
        `Nuevo viaje!\n` +
        `De: ${data.origen_direccion}\n` +
        `A: ${data.destino_direccion}\n` +
        `Precio: ${data.precio_referencial} Bs`
    );
    
    if (aceptar) {
        // 3. Aceptar viaje
        await fetch(`/admin/api/viajes/${data.viaje_id}/oferta`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                piloto_id: 1,
                precio_ofrecido: data.precio_referencial  // o diferente para contraoferta
            })
        });
    }
});

// 4. Esperar confirmación del pasajero
socket.on('viaje_confirmado', async (data) => {
    alert('Viaje confirmado! Recoge al pasajero.');
    
    // 5. Cuando llegues al origen, iniciar viaje
    await fetch(`/admin/api/viajes/${data.viaje_id}/iniciar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ piloto_id: 1 })
    });
});

// 6. Cuando llegues al destino, completar
await fetch(`/admin/api/viajes/${data.viaje_id}/completar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ piloto_id: 1 })
});
```
