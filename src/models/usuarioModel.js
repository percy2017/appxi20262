/**
 * Modelo de Usuarios
 * Maneja todas las operaciones de base de datos relacionadas con usuarios (administradores)
 */

import db from '../config/database.js';

/**
 * Obtiene todos los usuarios
 * @returns {Array} Lista de usuarios
 */
export function getAllUsuarios() {
    return db.prepare('SELECT id, username, nombre, email, telefono, avatar, rol, created_at, updated_at FROM usuarios ORDER BY created_at DESC').all();
}

/**
 * Obtiene un usuario por su ID
 * @param {number} id - ID del usuario
 * @returns {Object} Usuario encontrado
 */
export function getUsuarioById(id) {
    const usuarioId = parseInt(id);
    return db.prepare('SELECT id, username, nombre, email, telefono, avatar, rol, created_at, updated_at FROM usuarios WHERE id = ?').get(usuarioId);
}

/**
 * Obtiene un usuario por su username
 * @param {string} username - Username del usuario
 * @returns {Object} Usuario encontrado
 */
export function getUsuarioByUsername(username) {
    return db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username);
}

/**
 * Crea un nuevo usuario
 * @param {Object} usuario - Datos del usuario
 * @returns {Object} Usuario creado
 */
export function createUsuario(usuario) {
    console.log('Insertando en DB:', {
        username: usuario.username,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        avatar: usuario.avatar,
        rol: usuario.rol
    });
    
    const stmt = db.prepare(`
        INSERT INTO usuarios (username, password, nombre, email, telefono, avatar, rol)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
        usuario.username,
        usuario.password,
        usuario.nombre,
        usuario.email || null,
        usuario.telefono || null,
        usuario.avatar || null,
        usuario.rol || 'administrador'
    );
    
    console.log('ID insertado:', result.lastInsertRowid);
    return getUsuarioById(result.lastInsertRowid);
}

/**
 * Actualiza un usuario
 * @param {number} id - ID del usuario
 * @param {Object} usuario - Datos actualizados del usuario
 * @returns {Object} Usuario actualizado
 */
export function updateUsuario(id, usuario) {
    const usuarioId = parseInt(id);
    
    // Si se proporciona una contraseña, actualízala también
    if (usuario.password) {
        const stmt = db.prepare(`
            UPDATE usuarios 
            SET username = ?, nombre = ?, email = ?, telefono = ?, avatar = ?, rol = ?, password = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        stmt.run(
            usuario.username,
            usuario.nombre,
            usuario.email || null,
            usuario.telefono || null,
            usuario.avatar || null,
            usuario.rol || 'administrador',
            usuario.password,
            usuarioId
        );
    } else {
        const stmt = db.prepare(`
            UPDATE usuarios 
            SET username = ?, nombre = ?, email = ?, telefono = ?, avatar = ?, rol = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `);
        
        stmt.run(
            usuario.username,
            usuario.nombre,
            usuario.email || null,
            usuario.telefono || null,
            usuario.avatar || null,
            usuario.rol || 'administrador',
            usuarioId
        );
    }
    
    return getUsuarioById(usuarioId);
}

/**
 * Elimina un usuario
 * @param {number} id - ID del usuario
 * @returns {boolean} True si se eliminó correctamente
 */
export function deleteUsuario(id) {
    const usuarioId = parseInt(id);
    const stmt = db.prepare('DELETE FROM usuarios WHERE id = ?');
    const result = stmt.run(usuarioId);
    return result.changes > 0;
}

/**
 * Verifica las credenciales de un usuario
 * @param {string} username - Username
 * @param {string} password - Password
 * @returns {Object|null} Usuario si las credenciales son válidas
 */
export function verifyCredentials(username, password) {
    return db.prepare('SELECT id, username, nombre, email, rol FROM usuarios WHERE username = ? AND password = ?').get(username, password);
}

/**
 * Obtiene estadísticas de usuarios
 * @returns {Object} Estadísticas de usuarios
 */
export function getEstadisticasUsuarios() {
    const total = db.prepare('SELECT COUNT(*) as count FROM usuarios').get();
    const admins = db.prepare("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'administrador'").get();
    const choferes = db.prepare("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'chofer'").get();
    const pasajeros = db.prepare("SELECT COUNT(*) as count FROM usuarios WHERE rol = 'pasajero'").get();
    
    return {
        total: total.count,
        admins: admins.count,
        choferes: choferes.count,
        pasajeros: pasajeros.count
    };
}
