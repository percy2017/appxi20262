/**
 * Modelo de Viajes
 * Maneja todas las operaciones de base de datos relacionadas con viajes
 */

import db from '../config/database.js';

/**
 * Obtiene todos los viajes
 * @returns {Array} Lista de viajes
 */
export function getAllViajes() {
    return db.prepare(`
        SELECT v.*, p.nombre as pasajero_nombre, p.telefono as pasajero_telefono, p.avatar as pasajero_avatar,
               pil.nombre as piloto_nombre, pil.apellido as piloto_apellido, pil.telefono as piloto_telefono, pil.foto as piloto_foto
        FROM viajes v
        LEFT JOIN pasajeros p ON v.pasajero_id = p.id
        LEFT JOIN pilotos pil ON v.piloto_id = pil.id
        ORDER BY v.fecha_solicitud DESC
    `).all();
}

/**
 * Obtiene un viaje por su ID
 * @param {number} id - ID del viaje
 * @returns {Object} Viaje encontrado
 */
export function getViajeById(id) {
    return db.prepare(`
        SELECT v.*, p.nombre as pasajero_nombre, p.telefono as pasajero_telefono,
               pil.nombre as piloto_nombre, pil.apellido as piloto_apellido, pil.telefono as piloto_telefono
        FROM viajes v
        LEFT JOIN pasajeros p ON v.pasajero_id = p.id
        LEFT JOIN pilotos pil ON v.piloto_id = pil.id
        WHERE v.id = ?
    `).get(id);
}

/**
 * Obtiene viajes por estado
 * @param {string} estado - Estado del viaje
 * @returns {Array} Lista de viajes
 */
export function getViajesByEstado(estado) {
    return db.prepare(`
        SELECT v.*, p.nombre as pasajero_nombre, p.telefono as pasajero_telefono,
               pil.nombre as piloto_nombre, pil.apellido as piloto_apellido
        FROM viajes v
        LEFT JOIN pasajeros p ON v.pasajero_id = p.id
        LEFT JOIN pilotos pil ON v.piloto_id = pil.id
        WHERE v.estado = ?
        ORDER BY v.fecha_solicitud DESC
    `).all(estado);
}

/**
 * Obtiene viajes pendientes
 * @returns {Array} Lista de viajes pendientes
 */
export function getViajesPendientes() {
    return getViajesByEstado('pendiente');
}

/**
 * Obtiene viajes activos (en curso)
 * @returns {Array} Lista de viajes activos
 */
export function getViajesActivos() {
    return db.prepare(`
        SELECT v.*, p.nombre as pasajero_nombre, p.telefono as pasajero_telefono,
               pil.nombre as piloto_nombre, pil.apellido as piloto_apellido
        FROM viajes v
        LEFT JOIN pasajeros p ON v.pasajero_id = p.id
        LEFT JOIN pilotos pil ON v.piloto_id = pil.id
        WHERE v.estado = 'aceptado' OR v.estado = 'encurso'
        ORDER BY v.fecha_solicitud DESC
    `).all();
}

/**
 * Crea un nuevo viaje
 * @param {Object} viaje - Datos del viaje
 * @returns {Object} Viaje creado
 */
export function createViaje(viaje) {
    const stmt = db.prepare(`
        INSERT INTO viajes (pasajero_id, piloto_id, origen_direccion, origen_lat, origen_lng,
                          destino_direccion, destino_lat, destino_lng, distancia, duracion_estimada,
                          precio, precio_aceptado, metodo_pago, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
        viaje.pasajero_id || null,
        viaje.piloto_id || null,
        viaje.origen_direccion,
        viaje.origen_lat,
        viaje.origen_lng,
        viaje.destino_direccion,
        viaje.destino_lat,
        viaje.destino_lng,
        viaje.distancia || null,
        viaje.duracion_estimada || null,
        viaje.precio || null,
        viaje.precio_aceptado || null,
        viaje.metodo_pago || 'efectivo',
        viaje.estado || 'buscando'
    );
    
    return getViajeById(result.lastInsertRowid);
}

/**
 * Actualiza un viaje
 * @param {number} id - ID del viaje
 * @param {Object} viaje - Datos actualizados del viaje
 * @returns {Object} Viaje actualizado
 */
export function updateViaje(id, viaje) {
    const stmt = db.prepare(`
        UPDATE viajes 
        SET piloto_id = ?, origen_direccion = ?, origen_lat = ?, origen_lng = ?,
            destino_direccion = ?, destino_lat = ?, destino_lng = ?,
            distancia = ?, precio = ?, estado = ?,
            fecha_inicio = ?, fecha_fin = ?
        WHERE id = ?
    `);
    
    stmt.run(
        viaje.piloto_id || null,
        viaje.origen_direccion,
        viaje.origen_lat,
        viaje.origen_lng,
        viaje.destino_direccion,
        viaje.destino_lat,
        viaje.destino_lng,
        viaje.distancia || null,
        viaje.precio || null,
        viaje.estado || 'pendiente',
        viaje.fecha_inicio || null,
        viaje.fecha_fin || null,
        id
    );
    
    return getViajeById(id);
}

/**
 * Actualiza el estado de un viaje
 * @param {number} id - ID del viaje
 * @param {string} estado - Nuevo estado
 * @returns {Object} Viaje actualizado
 */
export function updateViajeEstado(id, estado) {
    let fechaUpdate = '';
    
    if (estado === 'encurso') {
        fechaUpdate = ', fecha_inicio = CURRENT_TIMESTAMP';
    } else if (estado === 'completado') {
        fechaUpdate = ', fecha_fin = CURRENT_TIMESTAMP';
    }
    
    const stmt = db.prepare(`
        UPDATE viajes 
        SET estado = ? ${fechaUpdate}
        WHERE id = ?
    `);
    
    stmt.run(estado, id);
    return getViajeById(id);
}

/**
 * Acepta un viaje (asigna piloto)
 * @param {number} id - ID del viaje
 * @param {number} pilotoId - ID del piloto
 * @returns {Object} Viaje actualizado
 */
export function aceptarViaje(id, pilotoId) {
    const stmt = db.prepare(`
        UPDATE viajes 
        SET piloto_id = ?, estado = 'aceptado', fecha_inicio = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    stmt.run(pilotoId, id);
    return getViajeById(id);
}

/**
 * Cancela un viaje
 * @param {number} id - ID del viaje
 * @returns {Object} Viaje actualizado
 */
export function cancelarViaje(id) {
    return updateViajeEstado(id, 'cancelado');
}

/**
 * Completa un viaje
 * @param {number} id - ID del viaje
 * @returns {Object} Viaje actualizado
 */
export function completarViaje(id) {
    return updateViajeEstado(id, 'completado');
}

/**
 * Elimina un viaje
 * @param {number} id - ID del viaje
 * @returns {boolean} True si se eliminó correctamente
 */
export function deleteViaje(id) {
    const stmt = db.prepare('DELETE FROM viajes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
}

/**
 * Obtiene estadísticas de viajes
 * @returns {Object} Estadísticas de viajes
 */
export function getEstadisticasViajes() {
    const total = db.prepare('SELECT COUNT(*) as count FROM viajes').get();
    const pendientes = db.prepare("SELECT COUNT(*) as count FROM viajes WHERE estado = 'pendiente'").get();
    const completados = db.prepare("SELECT COUNT(*) as count FROM viajes WHERE estado = 'completado'").get();
    const cancelados = db.prepare("SELECT COUNT(*) as count FROM viajes WHERE estado = 'cancelado'").get();
    
    const ingresos = db.prepare("SELECT SUM(precio) as total FROM viajes WHERE estado = 'completado' AND precio IS NOT NULL").get();
    
    return {
        total: total.count,
        pendientes: pendientes.count,
        completados: completados.count,
        cancelados: cancelados.count,
        ingresos: ingresos.total || 0
    };
}

/**
 * Obtiene viajes de hoy
 * @returns {Array} Lista de viajes de hoy
 */
export function getViajesHoy() {
    return db.prepare(`
        SELECT v.*, p.nombre as pasajero_nombre, pil.nombre as piloto_nombre
        FROM viajes v
        LEFT JOIN pasajeros p ON v.pasajero_id = p.id
        LEFT JOIN pilotos pil ON v.piloto_id = pil.id
        WHERE DATE(v.fecha_solicitud) = DATE('now')
        ORDER BY v.fecha_solicitud DESC
    `).all();
}
