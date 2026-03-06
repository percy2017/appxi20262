/**
 * Modelo de Plantillas de Notificaciones
 * Maneja las operaciones de base de datos para plantillas de WhatsApp
 */

import db from '../config/database.js';

/**
 * Obtiene todas las plantillas
 * @returns {Array} Lista de plantillas
 */
export function getAllPlantillas() {
    return db.prepare('SELECT * FROM plantillas_notificaciones ORDER BY clave ASC').all();
}

/**
 * Obtiene una plantilla por su clave
 * @param {string} clave - Clave de la plantilla
 * @returns {Object} Plantilla encontrada
 */
export function getPlantillaByClave(clave) {
    return db.prepare('SELECT * FROM plantillas_notificaciones WHERE clave = ?').get(clave);
}

/**
 * Obtiene una plantilla por su ID
 * @param {number} id - ID de la plantilla
 * @returns {Object} Plantilla encontrada
 */
export function getPlantillaById(id) {
    const plantillaId = parseInt(id);
    return db.prepare('SELECT * FROM plantillas_notificaciones WHERE id = ?').get(plantillaId);
}

/**
 * Obtiene solo las plantillas activas
 * @returns {Array} Lista de plantillas activas
 */
export function getPlantillasActivas() {
    return db.prepare('SELECT * FROM plantillas_notificaciones WHERE activo = 1').all();
}

/**
 * Crea una nueva plantilla
 * @param {Object} plantilla - Datos de la plantilla
 * @returns {Object} Plantilla creada
 */
export function createPlantilla(plantilla) {
    const stmt = db.prepare(`
        INSERT INTO plantillas_notificaciones (clave, titulo, mensaje, activo)
        VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(
        plantilla.clave,
        plantilla.titulo,
        plantilla.mensaje,
        plantilla.activo !== undefined ? plantilla.activo : 1
    );
    
    return getPlantillaById(result.lastInsertRowid);
}

/**
 * Actualiza una plantilla
 * @param {number} id - ID de la plantilla
 * @param {Object} plantilla - Datos actualizados
 * @returns {Object} Plantilla actualizada
 */
export function updatePlantilla(id, plantilla) {
    const plantillaId = parseInt(id);
    
    const stmt = db.prepare(`
        UPDATE plantillas_notificaciones 
        SET titulo = ?, mensaje = ?, activo = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `);
    
    stmt.run(
        plantilla.titulo,
        plantilla.mensaje,
        plantilla.activo !== undefined ? plantilla.activo : 1,
        plantillaId
    );
    
    return getPlantillaById(plantillaId);
}

/**
 * Elimina una plantilla
 * @param {number} id - ID de la plantilla
 * @returns {boolean} True si se eliminó correctamente
 */
export function deletePlantilla(id) {
    const plantillaId = parseInt(id);
    const stmt = db.prepare('DELETE FROM plantillas_notificaciones WHERE id = ?');
    const result = stmt.run(plantillaId);
    return result.changes > 0;
}

/**
 * Reemplaza variables en la plantilla
 * @param {string} mensaje - Mensaje con variables
 * @param {Object} datos - Datos para reemplazar
 * @returns {string} Mensaje con variables reemplazadas
 */
export function renderPlantilla(mensaje, datos) {
    let resultado = mensaje;
    for (const [key, value] of Object.entries(datos)) {
        resultado = resultado.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return resultado;
}
