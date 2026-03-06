/**
 * Modelo de Pasajeros
 * Maneja todas las operaciones de base de datos relacionadas con pasajeros
 */

import db from '../config/database.js';

/**
 * Obtiene todos los pasajeros
 * @returns {Array} Lista de pasajeros
 */
export function getAllPasajeros() {
    return db.prepare('SELECT * FROM pasajeros ORDER BY created_at DESC').all();
}

/**
 * Obtiene un pasajero por su ID
 * @param {number} id - ID del pasajero
 * @returns {Object} Pasajero encontrado
 */
export function getPasajeroById(id) {
    const pasajeroId = parseInt(id);
    return db.prepare('SELECT * FROM pasajeros WHERE id = ?').get(pasajeroId);
}

/**
 * Obtiene un pasajero por su teléfono
 * @param {string} telefono - Teléfono del pasajero
 * @returns {Object} Pasajero encontrado
 */
export function getPasajeroByTelefono(telefono) {
    return db.prepare('SELECT * FROM pasajeros WHERE telefono = ?').get(telefono);
}

/**
 * Crea o actualiza un pasajero (upsert)
 * @param {Object} pasajero - Datos del pasajero
 * @returns {Object} Pasajero creado o actualizado
 */
export function upsertPasajero(pasajero) {
    const existing = getPasajeroByTelefono(pasajero.telefono);
    
    if (existing) {
        // Actualizar existente (incluyendo avatar si está disponible)
        const stmt = db.prepare(`
            UPDATE pasajeros 
            SET nombre = ?, email = ?, direccion = ?, avatar = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        stmt.run(
            pasajero.nombre || existing.nombre,
            pasajero.email || existing.email,
            pasajero.direccion || existing.direccion,
            pasajero.avatar || existing.avatar,
            existing.id
        );
        
        return getPasajeroById(existing.id);
    } else {
        // Crear nuevo (incluyendo avatar si está disponible)
        const stmt = db.prepare(`
            INSERT INTO pasajeros (nombre, telefono, email, direccion, avatar)
            VALUES (?, ?, ?, ?, ?)
        `);
        
        const result = stmt.run(
            pasajero.nombre,
            pasajero.telefono,
            pasajero.email || null,
            pasajero.direccion || null,
            pasajero.avatar || null
        );
        
        return getPasajeroById(result.lastInsertRowid);
    }
}

/**
 * Crea un nuevo pasajero
 * @param {Object} pasajero - Datos del pasajero
 * @returns {Object} Pasajero creado
 */
export function createPasajero(pasajero) {
    const stmt = db.prepare(`
        INSERT INTO pasajeros (nombre, telefono, email, direccion, avatar)
        VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
        pasajero.nombre,
        pasajero.telefono,
        pasajero.email || null,
        pasajero.direccion || null,
        pasajero.avatar || null
    );
    
    return getPasajeroById(result.lastInsertRowid);
}

/**
 * Actualiza un pasajero
 * @param {number} id - ID del pasajero
 * @param {Object} pasajero - Datos actualizados del pasajero
 * @returns {Object} Pasajero actualizado
 */
export function updatePasajero(id, pasajero) {
    const pasajeroId = parseInt(id);
    
    const stmt = db.prepare(`
        UPDATE pasajeros 
        SET nombre = ?, telefono = ?, email = ?, direccion = ?, avatar = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    stmt.run(
        pasajero.nombre,
        pasajero.telefono,
        pasajero.email || null,
        pasajero.direccion || null,
        pasajero.avatar || null,
        pasajeroId
    );
    
    return getPasajeroById(pasajeroId);
}

/**
 * Elimina un pasajero
 * Primero elimina los viajes y reseñas relacionados, y también la imagen de perfil
 * @param {number} id - ID del pasajero
 * @returns {boolean} True si se eliminó correctamente
 */
export function deletePasajero(id) {
    const pasajeroId = parseInt(id);
    
    try {
        // Obtener el pasajero para eliminar su imagen
        const pasajero = getPasajeroById(pasajeroId);
        
        // Eliminar reseñas relacionadas con los viajes del pasajero
        db.prepare(`
            DELETE FROM resenas WHERE pasajero_id = ?
        `).run(pasajeroId);
        
        // Eliminar viajes del pasajero
        db.prepare(`
            DELETE FROM viajes WHERE pasajero_id = ?
        `).run(pasajeroId);
        
        // Ahora eliminar el pasajero
        const stmt = db.prepare('DELETE FROM pasajeros WHERE id = ?');
        const result = stmt.run(pasajeroId);
        
        // Eliminar imagen del filesystem si existe
        if (pasajero && pasajero.avatar) {
            try {
                const fs = require('fs');
                const path = require('path');
                const imagePath = path.join(process.cwd(), 'public', pasajero.avatar);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                    console.log('🗑️ Imagen eliminada:', pasajero.avatar);
                }
            } catch (imgError) {
                console.error('Error al eliminar imagen:', imgError);
            }
        }
        
        return result.changes > 0;
    } catch (error) {
        console.error('Error al eliminar pasajero:', error);
        return false;
    }
}

/**
 * Obtiene estadísticas de pasajeros
 * @returns {Object} Estadísticas de pasajeros
 */
export function getEstadisticasPasajeros() {
    const total = db.prepare('SELECT COUNT(*) as count FROM pasajeros').get();
    return {
        total: total.count
    };
}
