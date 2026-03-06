/**
 * Controlador de Usuarios
 * Maneja la lógica de negocio para la gestión de usuarios (administradores)
 */

import * as usuarioModel from '../models/usuarioModel.js';

/**
 * Renderiza la página de gestión de usuarios
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function usuariosPage(req, res) {
    try {
        const usuarios = usuarioModel.getAllUsuarios();
        const estadisticas = usuarioModel.getEstadisticasUsuarios();
        
        res.renderWithLayout('admin/usuarios', {
            title: 'Gestión de Usuarios - Admin MotoTaxi',
            usuarios,
            estadisticas,
            currentPage: 'usuarios'
        });
    } catch (error) {
        console.error('Error en usuariosPage:', error);
        res.status(500).render('error', { message: 'Error al cargar la página de usuarios' });
    }
}

/**
 * API: Obtiene todos los usuarios (para DataTables)
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function getUsuarios(req, res) {
    try {
        const usuarios = usuarioModel.getAllUsuarios();
        res.json({
            success: true,
            data: usuarios
        });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios'
        });
    }
}

/**
 * API: Crea un nuevo usuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function createUsuario(req, res) {
    try {
        const usuario = req.body;
        console.log('Datos recibidos:', usuario);
        
        // Validar campos requeridos
        if (!usuario.username || !usuario.password || !usuario.nombre) {
            return res.status(400).json({
                success: false,
                message: 'Los campos usuario, contraseña y nombre son requeridos'
            });
        }
        
        // Verificar si el username ya existe
        const existingUser = usuarioModel.getUsuarioByUsername(usuario.username);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya existe'
            });
        }
        
        console.log('Creando usuario...');
        const nuevoUsuario = usuarioModel.createUsuario(usuario);
        console.log('Usuario creado:', nuevoUsuario);
        
        res.json({
            success: true,
            message: 'Usuario creado correctamente',
            data: nuevoUsuario
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear usuario: ' + error.message
        });
    }
}

/**
 * API: Actualiza un usuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function updateUsuario(req, res) {
    try {
        const { id } = req.params;
        const usuario = req.body;
        
        // Convertir id a número
        const usuarioId = parseInt(id);
        
        // Validar campos requeridos
        if (!usuario.username || !usuario.nombre) {
            return res.status(400).json({
                success: false,
                message: 'Los campos usuario y nombre son requeridos'
            });
        }
        
        // Verificar si el usuario existe
        const existingUsuario = usuarioModel.getUsuarioById(usuarioId);
        if (!existingUsuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Verificar si el username ya existe en otro usuario
        const existingUser = usuarioModel.getUsuarioByUsername(usuario.username);
        if (existingUser && existingUser.id !== usuarioId) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya existe'
            });
        }
        
        const usuarioActualizado = usuarioModel.updateUsuario(usuarioId, usuario);
        
        res.json({
            success: true,
            message: 'Usuario actualizado correctamente',
            data: usuarioActualizado
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar usuario: ' + error.message
        });
    }
}

/**
 * API: Elimina un usuario
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function deleteUsuario(req, res) {
    try {
        const { id } = req.params;
        
        // Convertir id a número
        const usuarioId = parseInt(id);
        
        // Verificar si el usuario existe
        const existingUsuario = usuarioModel.getUsuarioById(usuarioId);
        if (!existingUsuario) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // No permitir eliminar al último admin
        const estadisticas = usuarioModel.getEstadisticasUsuarios();
        if (existingUsuario.rol === 'administrador' && estadisticas.admins <= 1) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el último administrador'
            });
        }
        
        const deleted = usuarioModel.deleteUsuario(usuarioId);
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Usuario eliminado correctamente'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error al eliminar usuario'
            });
        }
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar usuario: ' + error.message
        });
    }
}

/**
 * API: Obtiene estadísticas de usuarios
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function getEstadisticas(req, res) {
    try {
        const estadisticas = usuarioModel.getEstadisticasUsuarios();
        res.json({
            success: true,
            data: estadisticas
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
}
