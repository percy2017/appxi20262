/**
 * Modelo de Pilotos
 * Maneja todas las operaciones de base de datos relacionadas con pilotos
 */

import db from '../config/database.js';

/**
 * Obtiene todos los pilotos
 * @returns {Array} Lista de pilotos
 */
export function getAllPilotos() {
    return db.prepare('SELECT * FROM pilotos ORDER BY created_at DESC').all();
}

/**
 * Obtiene un piloto por su ID
 * @param {number} id - ID del piloto
 * @returns {Object} Piloto encontrado
 */
export function getPilotoById(id) {
    return db.prepare('SELECT * FROM pilotos WHERE id = ?').get(id);
}

/**
 * Obtiene pilotos por estado
 * @param {string} estado - Estado del piloto (disponible, ocupado, inactivo)
 * @returns {Array} Lista de pilotos
 */
export function getPilotosByEstado(estado) {
    return db.prepare('SELECT * FROM pilotos WHERE estado = ?').all(estado);
}

/**
 * Obtiene pilotos disponibles
 * @returns {Array} Lista de pilotos disponibles
 */
export function getPilotosDisponibles() {
    return db.prepare("SELECT * FROM pilotos WHERE estado = 'disponible'").all();
}

/**
 * Crea un nuevo piloto
 * @param {Object} piloto - Datos del piloto
 * @returns {Object} Piloto creado
 */
export function createPiloto(piloto) {
    const stmt = db.prepare(`
        INSERT INTO pilotos (nombre, telefono, licencia, placa, modelo, color, foto, foto_vehiculo, estado)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
        piloto.nombre,
        piloto.telefono,
        piloto.licencia,
        piloto.placa,
        piloto.modelo || null,
        piloto.color || null,
        piloto.foto || null,
        piloto.foto_vehiculo || null,
        piloto.estado || 'disponible'
    );
    
    return getPilotoById(result.lastInsertRowid);
}

/**
 * Actualiza un piloto
 * @param {number} id - ID del piloto
 * @param {Object} piloto - Datos actualizados del piloto
 * @returns {Object} Piloto actualizado
 */
export function updatePiloto(id, piloto) {
    const stmt = db.prepare(`
        UPDATE pilotos 
        SET nombre = ?, telefono = ?, licencia = ?, 
            placa = ?, modelo = ?, color = ?, foto = ?, foto_vehiculo = ?, estado = ?,
            latitud = ?, longitud = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    stmt.run(
        piloto.nombre,
        piloto.telefono,
        piloto.licencia,
        piloto.placa,
        piloto.modelo || null,
        piloto.color || null,
        piloto.foto || null,
        piloto.foto_vehiculo || null,
        piloto.estado || 'disponible',
        piloto.latitud || null,
        piloto.longitud || null,
        id
    );
    
    return getPilotoById(id);
}

/**
 * Actualiza la ubicación de un piloto
 * @param {number} id - ID del piloto
 * @param {number} latitud - Latitud
 * @param {number} longitud - Longitud
 * @returns {Object} Piloto actualizado
 */
export function updatePilotoUbicacion(id, latitud, longitud) {
    const stmt = db.prepare(`
        UPDATE pilotos 
        SET latitud = ?, longitud = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    stmt.run(latitud, longitud, id);
    return getPilotoById(id);
}

/**
 * Actualiza el estado de un piloto
 * @param {number} id - ID del piloto
 * @param {string} estado - Nuevo estado
 * @returns {Object} Piloto actualizado
 */
export function updatePilotoEstado(id, estado) {
    const stmt = db.prepare(`
        UPDATE pilotos 
        SET estado = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    stmt.run(estado, id);
    return getPilotoById(id);
}

/**
 * Elimina un piloto
 * @param {number} id - ID del piloto
 * @returns {boolean} True si se eliminó correctamente
 */
export function deletePiloto(id) {
    const stmt = db.prepare('DELETE FROM pilotos WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
}

/**
 * Obtiene estadísticas de pilotos
 * @returns {Object} Estadísticas de pilotos
 */
export function getEstadisticasPilotos() {
    const total = db.prepare('SELECT COUNT(*) as count FROM pilotos').get();
    const disponibles = db.prepare("SELECT COUNT(*) as count FROM pilotos WHERE estado = 'disponible'").get();
    const ocupados = db.prepare("SELECT COUNT(*) as count FROM pilotos WHERE estado = 'ocupado'").get();
    
    return {
        total: total.count,
        disponibles: disponibles.count,
        ocupados: ocupados.count
    };
}
