/**
 * Controlador del WebApp Pasajero
 * Maneja las APIs específicas para la aplicación del pasajero
 */

import * as pasajeroModel from '../models/pasajeroModel.js';
import * as viajeModel from '../models/viajeModel.js';
import db from '../config/database.js';

// Configuración de precios desde variables de entorno
const MONEDA = process.env.MONEDA || 'Bs';
const PRECIO_BASE = parseFloat(process.env.PRECIO_BASE || '10');
const PRECIO_KM = parseFloat(process.env.PRECIO_KM || '3');
const PRECIO_MINUTO = parseFloat(process.env.PRECIO_MINUTO || '0.50');
const TIEMPO_ESPERA_MAX = parseInt(process.env.TIEMPO_ESPERA_MAX || '600');
const OSRM_URL = process.env.OSRM_URL || 'https://router.project-osrm.org';

// Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://217.216.43.75:2001';
const EVOLUTION_API_TOKEN = process.env.EVOLUTION_API_TOKEN || 'evolution2001';

/**
 * Envía notificación por WhatsApp usando Evolution API
 * @param {string} numero - Número de teléfono
 * @param {string} mensaje - Mensaje a enviar
 * @returns {Promise<boolean>}
 */
async function enviarNotificacionWhatsApp(numero, mensaje) {
    try {
        // Limpiar número
        let cleanNumber = numero.replace(/[\s\-\(\)]/g, '');
        if (!cleanNumber.startsWith('+') && !cleanNumber.startsWith('591')) {
            if (cleanNumber.startsWith('7') || cleanNumber.startsWith('6')) {
                cleanNumber = '591' + cleanNumber;
            }
        }
        
        // Obtener instancia activa
        const instancesRes = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
                'apikey': EVOLUTION_API_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        const instances = await instancesRes.json();
        const openInstance = instances.find(inst => inst.connectionStatus === 'open');
        
        if (!openInstance) {
            console.log('❌ No hay instancias de WhatsApp disponibles');
            return false;
        }
        
        // Enviar mensaje
        const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${openInstance.name}`, {
            method: 'POST',
            headers: {
                'apikey': EVOLUTION_API_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                number: cleanNumber,
                text: mensaje
            })
        });
        
        if (response.ok) {
            console.log(`✅ WhatsApp enviado a ${cleanNumber}`);
            return true;
        } else {
            console.log(`❌ Error al enviar WhatsApp: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error('❌ Error en notificación WhatsApp:', error.message);
        return false;
    }
}

/**
 * Obtiene la ruta y tiempo estimado usando OSRM
 * @param {number} lat1 - Latitud origen
 * @param {number} lng1 - Longitud origen
 * @param {number} lat2 - Latitud destino
 * @param {number} lng2 - Longitud destino
 * @returns {Promise<Object>} { distancia_km, duracion_minutos, ruta_coordenadas }
 */
async function obtenerRutaOSRM(lat1, lng1, lat2, lng2) {
    try {
        // OSRM API - route para motorcycle
        const url = `${OSRM_URL}/route/v1/motorcycle/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`OSRM error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            throw new Error('No se pudo obtener la ruta');
        }
        
        const route = data.routes[0];
        
        // Distancia en metros a km
        const distancia_km = route.distance / 1000;
        
        // Duración en segundos a minutos
        const duracion_minutos = route.duration / 60;
        
        // Obtener coordenadas de la ruta
        const ruta_coordenadas = route.geometry.coordinates.map(coord => ({
            lng: coord[0],
            lat: coord[1]
        }));
        
        return {
            distancia_km: Math.round(distancia_km * 100) / 100,
            duracion_minutos: Math.round(duracion_minutos),
            ruta_coordenadas
        };
    } catch (error) {
        console.error('Error en OSRM:', error.message);
        // Fallback: calcular con Haversine
        const distancia = calcularDistancia(lat1, lng1, lat2, lng2);
        const duracion = distancia / 30 * 60; // Asumiendo 30 km/h promedio
        return {
            distancia_km: Math.round(distancia * 100) / 100,
            duracion_minutos: Math.round(duracion),
            ruta_coordenadas: null
        };
    }
}

/**
 * Calcula el precio del viaje basado en distancia y tiempo
 * @param {number} distancia_km - Distancia en km
 * @param {number} duracion_minutos - Duración estimada en minutos
 * @returns {number} Precio calculado en Bs
 */
function calcularPrecio(distancia_km, duracion_minutos) {
    const precio = PRECIO_BASE + (distancia_km * PRECIO_KM) + (duracion_minutos * PRECIO_MINUTO);
    return Math.round(precio * 100) / 100; // Redondear a 2 decimales
}

/**
 * Obtiene la dirección a partir de coordenadas usando Nominatim (OpenStreetMap)
 * @param {number} lat - Latitud
 * @param {number} lng - Longitud
 * @returns {Promise<string>} Dirección o coordenadas como fallback
 */
async function obtenerDireccionDesdeCoords(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'MotoTaxi-App/1.0'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error('Error en geocodificación');
        }
        
        const data = await response.json();
        
        if (data.address) {
            const parts = [];
            if (data.address.road) parts.push(data.address.road);
            if (data.address.neighbourhood) parts.push(data.address.neighbourhood);
            if (data.address.city || data.address.town || data.address.village) {
                parts.push(data.address.city || data.address.town || data.address.village);
            }
            if (data.address.state) parts.push(data.address.state);
            
            if (parts.length > 0) {
                return parts.join(', ');
            }
        }
        
        if (data.display_name) {
            return data.display_name.split(',').slice(0, 3).join(',');
        }
        
        return `${lat}, ${lng}`;
    } catch (error) {
        console.error('Error en geocodificación:', error.message);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

/**
 * API: Solicitar un nuevo viaje
 * POST /admin/api/viajes/solicitar
 * El WebApp solo envía coordenadas - el backend:
 * 1. Obtiene la ruta real con OSRM
 * 2. Calcula precio referencial (base + distancia + tiempo)
 * 3. Envía a choferes disponibles
 */
export async function solicitarViaje(req, res) {
    try {
        const { pasajero_id, origen_lat, origen_lng, destino_lat, destino_lng, metodo_pago } = req.body;
        
        // Validar campos requeridos
        if (!pasajero_id || !origen_lat || !origen_lng || !destino_lat || !destino_lng) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos: pasajero_id, origen_lat, origen_lng, destino_lat, destino_lng'
            });
        }
        
        // Validar método de pago
        const metodoPagoValido = ['efectivo', 'qr'].includes(metodo_pago);
        if (!metodo_pago || !metodoPagoValido) {
            return res.status(400).json({
                success: false,
                message: 'El método de pago es requerido: "efectivo" o "qr"'
            });
        }
        
        // Verificar que el pasajero existe
        const pasajero = pasajeroModel.getPasajeroById(pasajero_id);
        if (!pasajero) {
            return res.status(404).json({
                success: false,
                message: 'Pasajero no encontrado'
            });
        }
        
        // Obtener direcciones desde las coordenadas
        console.log('🗺️ Obteniendo direcciones...');
        const origen_direccion = await obtenerDireccionDesdeCoords(parseFloat(origen_lat), parseFloat(origen_lng));
        const destino_direccion = await obtenerDireccionDesdeCoords(parseFloat(destino_lat), parseFloat(destino_lng));
        
        console.log('🛣️ Calculando ruta con OSRM...');
        // Obtener ruta real con OSRM (motocicleta)
        const ruta = await obtenerRutaOSRM(
            parseFloat(origen_lat), 
            parseFloat(origen_lng), 
            parseFloat(destino_lat), 
            parseFloat(destino_lng)
        );
        
        // Calcular precio referencial
        const precio_referencial = calcularPrecio(ruta.distancia_km, ruta.duracion_minutos);
        
        console.log(`📍 Origen: ${origen_direccion}`);
        console.log(`📍 Destino: ${destino_direccion}`);
        console.log(`📏 Distancia: ${ruta.distancia_km} km`);
        console.log(`⏱️ Tiempo estimado: ${ruta.duracion_minutos} minutos`);
        console.log(`💰 Precio referencial: ${precio_referencial} ${MONEDA}`);
        
        // Crear el viaje en estado "buscando" (esperando ofertas de choferes)
        const viaje = viajeModel.createViaje({
            pasajero_id: parseInt(pasajero_id),
            origen_lat: parseFloat(origen_lat),
            origen_lng: parseFloat(origen_lng),
            origen_direccion,
            destino_lat: parseFloat(destino_lat),
            destino_lng: parseFloat(destino_lng),
            destino_direccion,
            distancia: ruta.distancia_km,
            duracion_estimada: ruta.duracion_minutos,
            precio: precio_referencial,
            precio_aceptado: null,
            metodo_pago: metodo_pago,
            estado: 'buscando' // Estado: buscando, aceptado, iniciado, completado, cancelado
        });
        
        // Emitir evento de socket para notificar a los pilotos
        const io = req.app.get('io');
        let hayChoferes = false;
        
        if (io) {
            // Enviar a todos los pilotos disponibles (sala 'pilotos')
            // El número de pilotos en la sala se puede verificar
            const socketsPilotos = io.sockets.adapter.rooms.get('pilotos');
            hayChoferes = socketsPilotos && socketsPilotos.size > 0;
            
            if (hayChoferes) {
                // Hay choferes disponibles - enviar solicitud
                io.to('pilotos').emit('nueva_solicitud', {
                    viaje_id: viaje.id,
                    pasajero_id: pasajero.id,
                    pasajero_nombre: pasajero.nombre,
                    pasajero_telefono: pasajero.telefono,
                    origen_direccion,
                    origen_lat: parseFloat(origen_lat),
                    origen_lng: parseFloat(origen_lng),
                    destino_direccion,
                    destino_lat: parseFloat(destino_lat),
                    destino_lng: parseFloat(destino_lng),
                    distancia_km: ruta.distancia_km,
                    duracion_minutos: ruta.duracion_minutos,
                    precio_referencial: precio_referencial,
                    metodo_pago: metodo_pago,
                    ruta_coordenadas: ruta.ruta_coordenadas
                });
            }
        }
        
        // Notificar al pasajero sobre el estado
        if (!hayChoferes) {
            // No hay choferes disponibles - notificar inmediatamente
            if (io) {
                io.to(`pasajero_${pasajero.id}`).emit('sin_choferes', {
                    viaje_id: viaje.id,
                    mensaje: 'No hay choferes disponibles en este momento. Intenta más tarde.'
                });
            }
            
            // Enviar notificación por WhatsApp al pasajero
            const mensajeNoChoferes = `🚗 *Appxi - Solicitud de Viaje*\n\nLo sentimos, no hay choferes disponibles en este momento.\n\nTe notificaremos cuando algún chofer acepte tu solicitud.\n\n📍 * Origen:* ${origen_direccion}\n🏁 *Destino:* ${destino_direccion}`;
            await enviarNotificacionWhatsApp(pasajero.telefono, mensajeNoChoferes);
            
            return res.json({
                success: true,
                message: 'No hay choferes disponibles. Te notificaremos cuando alguno se conecte.',
                data: {
                    ...viaje,
                    precio_referencial,
                    duracion_estimada: ruta.duracion_minutos,
                    hay_choferes: false,
                    metodo_pago: metodo_pago
                }
            });
        } else {
            // Hay choferes - enviar notificación a todos los pilotos por WhatsApp
            // Obtener lista de pilotos para notificar
            const pilotos = db.prepare('SELECT telefono FROM pilotos WHERE estado = ?').all('disponible');
            
            for (const piloto of pilotos) {
                if (piloto.telefono) {
                    const mensajeNuevoViaje = `🚗 *Appxi - Nueva Solicitud de Viaje*\n\n📍 *Origen:* ${origen_direccion}\n🏁 *Destino:* ${destino_direccion}\n📏 *Distancia:* ${ruta.distancia_km} km\n⏱️ *Tiempo:* ${ruta.duracion_minutos} min\n💰 *Precio:* ${precio_referencial} ${MONEDA}\n💵 *Pago:* ${metodo_pago === 'efectivo' ? '💵 Efectivo' : '📱 QR'}\n\n¡Acepta este viaje en la app!`;
                    await enviarNotificacionWhatsApp(piloto.telefono, mensajeNuevoViaje);
                }
            }
        }
        
        res.json({
            success: true,
            message: 'Viaje publicado. Esperando ofertas de choferes...',
            data: {
                ...viaje,
                precio_referencial,
                duracion_estimada: ruta.duracion_minutos,
                tiempo_espera_max: TIEMPO_ESPERA_MAX,
                hay_choferes: true,
                metodo_pago: metodo_pago
            }
        });
    } catch (error) {
        console.error('Error al solicitar viaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al solicitar viaje: ' + error.message
        });
    }
}

/**
 * API: Obtener estado de un viaje
 * GET /api/viajes/:id
 */
export function getViaje(req, res) {
    try {
        const { id } = req.params;
        const viajeId = parseInt(id);
        
        const viaje = viajeModel.getViajeById(viajeId);
        
        if (!viaje) {
            return res.status(404).json({
                success: false,
                message: 'Viaje no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: viaje
        });
    } catch (error) {
        console.error('Error al obtener viaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener viaje: ' + error.message
        });
    }
}

/**
 * API: Obtener historial de viajes de un pasajero
 * GET /api/pasajero/:id/viajes
 */
export function getHistorialViajes(req, res) {
    try {
        const { id } = req.params;
        const pasajeroId = parseInt(id);
        
        // Verificar que el pasajero existe
        const pasajero = pasajeroModel.getPasajeroById(pasajeroId);
        if (!pasajero) {
            return res.status(404).json({
                success: false,
                message: 'Pasajero no encontrado'
            });
        }
        
        // Obtener viajes del pasajero
        const viajes = db.prepare(`
            SELECT v.*, pil.nombre as piloto_nombre, pil.apellido as piloto_apellido, 
                   pil.telefono as piloto_telefono, pil.placa as piloto_placa
            FROM viajes v
            LEFT JOIN pilotos pil ON v.piloto_id = pil.id
            WHERE v.pasajero_id = ?
            ORDER BY v.fecha_solicitud DESC
        `).all(pasajeroId);
        
        res.json({
            success: true,
            data: viajes
        });
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener historial: ' + error.message
        });
    }
}

/**
 * API: Crear una reseña
 * POST /api/resenas
 */
export function crearResena(req, res) {
    try {
        const { viaje_id, pasajero_id, piloto_id, calificacion, comentario } = req.body;
        
        // Validar campos requeridos
        if (!viaje_id || !pasajero_id || !piloto_id || !calificacion) {
            return res.status(400).json({
                success: false,
                message: 'Los campos viaje_id, pasajero_id, piloto_id y calificacion son requeridos'
            });
        }
        
        // Validar calificación (1-5)
        if (calificacion < 1 || calificacion > 5) {
            return res.status(400).json({
                success: false,
                message: 'La calificación debe estar entre 1 y 5'
            });
        }
        
        // Verificar que el viaje existe y está completado
        const viaje = viajeModel.getViajeById(parseInt(viaje_id));
        if (!viaje) {
            return res.status(404).json({
                success: false,
                message: 'Viaje no encontrado'
            });
        }
        
        if (viaje.estado !== 'completado') {
            return res.status(400).json({
                success: false,
                message: 'Solo puedes calificar viajes completados'
            });
        }
        
        // Insertar la reseña
        const stmt = db.prepare(`
            INSERT INTO resenas (viaje_id, pasajero_id, piloto_id, calificacion, comentario)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        stmt.run(
            parseInt(viaje_id),
            parseInt(pasajero_id),
            parseInt(piloto_id),
            parseInt(calificacion),
            comentario || null
        );
        
        res.json({
            success: true,
            message: 'Reseña guardada correctamente'
        });
    } catch (error) {
        console.error('Error al crear reseña:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear reseña: ' + error.message
        });
    }
}

/**
 * Función auxiliar para calcular distancia entre dos puntos
 * Fórmula de Haversine
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * API: Chofer hace oferta (acepta precio o contraoferta)
 * POST /admin/api/viajes/:id/oferta
 */
export async function hacerOferta(req, res) {
    try {
        const { id } = req.params;
        const { piloto_id, precio_ofrecido } = req.body;
        
        if (!piloto_id || !precio_ofrecido) {
            return res.status(400).json({
                success: false,
                message: 'piloto_id y precio_ofrecido son requeridos'
            });
        }
        
        const viajeId = parseInt(id);
        const viaje = viajeModel.getViajeById(viajeId);
        
        if (!viaje) {
            return res.status(404).json({
                success: false,
                message: 'Viaje no encontrado'
            });
        }
        
        if (viaje.estado !== 'buscando') {
            return res.status(400).json({
                success: false,
                message: 'El viaje ya no está buscando choferes'
            });
        }
        
        // Guardar la oferta del chofer (actualiza piloto_id y precio_aceptado)
        const stmt = db.prepare(`
            UPDATE viajes 
            SET piloto_id = ?, precio_aceptado = ?, estado = 'aceptado'
            WHERE id = ?
        `);
        
        stmt.run(parseInt(piloto_id), parseFloat(precio_ofrecido), viajeId);
        
        // Obtener datos actualizados del viaje
        const viajeActualizado = viajeModel.getViajeById(viajeId);
        
        // Notificar al pasajero por Socket
        const io = req.app.get('io');
        if (io) {
            io.to(`pasajero_${viaje.pasajero_id}`).emit('oferta_aceptada', {
                viaje_id: viaje.id,
                piloto_id: piloto_id,
                precio_acordado: precio_ofrecido,
                mensaje: 'Un chofer ha aceptado tu solicitud de viaje'
            });
            
            io.to('admin').emit('viaje_actualizado', {
                viaje_id: viaje.id,
                estado: 'aceptado',
                piloto_id: piloto_id
            });
        }
        
        // Obtener datos del piloto para la notificación
        const piloto = db.prepare('SELECT nombre, telefono, placa FROM pilotos WHERE id = ?').get(piloto_id);
        
        // Enviar notificación por WhatsApp al pasajero
        if (piloto && viaje.pasajero_id) {
            const pasajeroNotif = db.prepare('SELECT telefono, nombre FROM pasajeros WHERE id = ?').get(viaje.pasajero_id);
            
            if (pasajeroNotif && pasajeroNotif.telefono) {
                const mensajeAceptado = `🚗 *Appxi - Viaje Aceptado*\n\n✅ *${piloto.nombre}* aceptó tu solicitud!\n\n🏍️ *Mototaxi:* ${piloto.placa || 'No especificada'}\n💰 *Precio acordado:* ${precio_ofrecido} ${MONEDA}\n\nConfirma el viaje en la app para continuar.`;
                await enviarNotificacionWhatsApp(pasajeroNotif.telefono, mensajeAceptado);
            }
        }
        
        res.json({
            success: true,
            message: 'Oferta enviada al pasajero',
            data: {
                viaje_id: viaje.id,
                precio_ofrecido,
                estado: 'aceptado'
            }
        });
    } catch (error) {
        console.error('Error al hacer oferta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al hacer oferta: ' + error.message
        });
    }
}

/**
 * API: Pasajero confirma viaje con el chofer
 * POST /admin/api/viajes/:id/confirmar
 */
export function confirmarViaje(req, res) {
    try {
        const { id } = req.params;
        const { pasajero_id } = req.body;
        
        const viajeId = parseInt(id);
        const viaje = viajeModel.getViajeById(viajeId);
        
        if (!viaje) {
            return res.status(404).json({
                success: false,
                message: 'Viaje no encontrado'
            });
        }
        
        if (viaje.pasajero_id !== parseInt(pasajero_id)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para confirmar este viaje'
            });
        }
        
        if (viaje.estado !== 'aceptado') {
            return res.status(400).json({
                success: false,
                message: 'El viaje debe estar aceptado para confirmar'
            });
        }
        
        // Confirmar el viaje - actualizar estado a iniciado
        const stmt = db.prepare(`
            UPDATE viajes 
            SET estado = 'iniciado', fecha_inicio = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        stmt.run(viajeId);
        
        const viajeActualizado = viajeModel.getViajeById(viajeId);
        
        // Notificar al chofer
        const io = req.app.get('io');
        if (io) {
            io.to(`piloto_${viaje.piloto_id}`).emit('viaje_confirmado', {
                viaje_id: viaje.id,
                pasajero_nombre: 'Pasajero',
                origen_direccion: viaje.origen_direccion,
                destino_direccion: viaje.destino_direccion
            });
        }
        
        res.json({
            success: true,
            message: 'Viaje confirmado. El chofer está en camino.',
            data: viajeActualizado
        });
    } catch (error) {
        console.error('Error al confirmar viaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al confirmar viaje: ' + error.message
        });
    }
}

/**
 * API: Chofer inicia el viaje (llega al origen)
 * POST /admin/api/viajes/:id/iniciar
 */
export async function iniciarViaje(req, res) {
    try {
        const { id } = req.params;
        const { piloto_id } = req.body;
        
        const viajeId = parseInt(id);
        const viaje = viajeModel.getViajeById(viajeId);
        
        if (!viaje) {
            return res.status(404).json({
                success: false,
                message: 'Viaje no encontrado'
            });
        }
        
        if (viaje.piloto_id !== parseInt(piloto_id)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para iniciar este viaje'
            });
        }
        
        if (viaje.estado !== 'aceptado') {
            return res.status(400).json({
                success: false,
                message: 'El viaje debe estar aceptado para iniciar'
            });
        }
        
        // Iniciar el viaje
        const stmt = db.prepare(`
            UPDATE viajes 
            SET estado = 'iniciado', fecha_inicio = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        stmt.run(viajeId);
        
        const viajeActualizado = viajeModel.getViajeById(viajeId);
        
        // Notificar al pasajero
        const io = req.app.get('io');
        if (io) {
            io.to(`pasajero_${viaje.pasajero_id}`).emit('viaje_iniciado', {
                viaje_id: viaje.id,
                mensaje: 'El chofer está en camino a tu ubicación'
            });
        }
        
        // Notificar por WhatsApp
        const pasajero = db.prepare('SELECT telefono FROM pasajeros WHERE id = ?').get(viaje.pasajero_id);
        if (pasajero && pasajero.telefono) {
            const mensaje = `🚗 *Appxi - Viaje Iniciado*\n\nEl chofer está en camino a recogerte.\n\n¡Prepárate!`;
            await enviarNotificacionWhatsApp(pasajero.telefono, mensaje);
        }
        
        res.json({
            success: true,
            message: 'Viaje iniciado',
            data: viajeActualizado
        });
    } catch (error) {
        console.error('Error al iniciar viaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al iniciar viaje: ' + error.message
        });
    }
}

/**
 * API: Chofer completa el viaje
 * POST /admin/api/viajes/:id/completar
 */
export async function completarViajeChofer(req, res) {
    try {
        const { id } = req.params;
        const { piloto_id } = req.body;
        
        const viajeId = parseInt(id);
        const viaje = viajeModel.getViajeById(viajeId);
        
        if (!viaje) {
            return res.status(404).json({
                success: false,
                message: 'Viaje no encontrado'
            });
        }
        
        if (viaje.piloto_id !== parseInt(piloto_id)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para completar este viaje'
            });
        }
        
        if (viaje.estado !== 'iniciado') {
            return res.status(400).json({
                success: false,
                message: 'El viaje debe estar iniciado para completar'
            });
        }
        
        // Completar el viaje
        const stmt = db.prepare(`
            UPDATE viajes 
            SET estado = 'completado', fecha_fin = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        stmt.run(viajeId);
        
        const viajeActualizado = viajeModel.getViajeById(viajeId);
        
        // Notificar al pasajero
        const io = req.app.get('io');
        if (io) {
            io.to(`pasajero_${viaje.pasajero_id}`).emit('viaje_completado', {
                viaje_id: viaje.id,
                precio: viajeActualizado.precio_aceptado || viajeActualizado.precio,
                mensaje: 'Viaje completado. Gracias por usar Appxi!'
            });
        }
        
        // Notificar por WhatsApp
        const pasajero = db.prepare('SELECT telefono, nombre FROM pasajeros WHERE id = ?').get(viaje.pasajero_id);
        if (pasajero && pasajero.telefono) {
            const mensaje = `🚗 *Appxi - Viaje Completado*\n\n¡Gracias por usar Appxi, ${pasajero.nombre}!\n\n💰 *Monto:* ${viajeActualizado.precio_aceptado || viajeActualizado.precio} ${MONEDA}\n\nTu calificación ayuda a mejorar el servicio.`;
            await enviarNotificacionWhatsApp(pasajero.telefono, mensaje);
        }
        
        res.json({
            success: true,
            message: 'Viaje completado',
            data: viajeActualizado
        });
    } catch (error) {
        console.error('Error al completar viaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al completar viaje: ' + error.message
        });
    }
}

/**
 * API: Cancelar viaje
 * POST /admin/api/viajes/:id/cancelar
 */
export async function cancelarViaje(req, res) {
    try {
        const { id } = req.params;
        const { piloto_id, motivo } = req.body;
        
        const viajeId = parseInt(id);
        const viaje = viajeModel.getViajeById(viajeId);
        
        if (!viaje) {
            return res.status(404).json({
                success: false,
                message: 'Viaje no encontrado'
            });
        }
        
        // Cancelar el viaje
        const stmt = db.prepare(`
            UPDATE viajes 
            SET estado = 'cancelado'
            WHERE id = ?
        `);
        
        stmt.run(viajeId);
        
        const viajeActualizado = viajeModel.getViajeById(viajeId);
        
        // Notificar al pasajero
        const io = req.app.get('io');
        if (io) {
            io.to(`pasajero_${viaje.pasajero_id}`).emit('viaje_cancelado', {
                viaje_id: viaje.id,
                motivo: motivo || 'El chofer canceló el viaje',
                mensaje: 'El chofer ha cancelado el viaje'
            });
        }
        
        res.json({
            success: true,
            message: 'Viaje cancelado',
            data: viajeActualizado
        });
    } catch (error) {
        console.error('Error al cancelar viaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar viaje: ' + error.message
        });
    }
}
