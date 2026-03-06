/**
 * Controlador Admin
 * Maneja la lógica de negocio para el panel de administración
 */

import * as pilotoModel from '../models/pilotoModel.js';
import * as viajeModel from '../models/viajeModel.js';
import { socketStats } from '../config/socket.js';

/**
 * Renderiza el dashboard principal del admin
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function dashboard(req, res) {
    try {
        const estadisticasPilotos = pilotoModel.getEstadisticasPilotos();
        const estadisticasViajes = viajeModel.getEstadisticasViajes();
        const pilotosRecientes = pilotoModel.getAllPilotos().slice(0, 5);
        const viajesRecientes = viajeModel.getAllViajes().slice(0, 5);
        
        res.renderWithLayout('admin/dashboard', {
            title: 'Dashboard - Admin MotoTaxi',
            estadisticasPilotos,
            estadisticasViajes,
            pilotosRecientes,
            viajesRecientes,
            currentPage: 'dashboard'
        });
    } catch (error) {
        console.error('Error en dashboard:', error);
        res.status(500).render('error', { message: 'Error al cargar el dashboard' });
    }
}

/**
 * API: Obtiene todos los pilotos (para DataTables)
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function getPilotos(req, res) {
    try {
        const pilotos = pilotoModel.getAllPilotos();
        res.json({
            success: true,
            data: pilotos
        });
    } catch (error) {
        console.error('Error al obtener pilotos:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pilotos'
        });
    }
}

/**
 * API: Obtiene todos los viajes (para DataTables)
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function getViajes(req, res) {
    try {
        const viajes = viajeModel.getAllViajes();
        res.json({
            success: true,
            data: viajes
        });
    } catch (error) {
        console.error('Error al obtener viajes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener viajes'
        });
    }
}

/**
 * API: Crea un nuevo piloto
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function createPiloto(req, res) {
    try {
        const piloto = req.body;
        
        // Validar campos requeridos
        if (!piloto.nombre || !piloto.apellido || !piloto.telefono || !piloto.licencia || !piloto.placa) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos requeridos deben ser completados'
            });
        }
        
        const nuevoPiloto = pilotoModel.createPiloto(piloto);
        
        res.json({
            success: true,
            message: 'Piloto creado correctamente',
            data: nuevoPiloto
        });
    } catch (error) {
        console.error('Error al crear piloto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear piloto: ' + error.message
        });
    }
}

/**
 * API: Actualiza un piloto
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function updatePiloto(req, res) {
    try {
        const { id } = req.params;
        const piloto = req.body;
        
        const pilotoActualizado = pilotoModel.updatePiloto(parseInt(id), piloto);
        
        res.json({
            success: true,
            message: 'Piloto actualizado correctamente',
            data: pilotoActualizado
        });
    } catch (error) {
        console.error('Error al actualizar piloto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar piloto'
        });
    }
}

/**
 * API: Elimina un piloto
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function deletePiloto(req, res) {
    try {
        const { id } = req.params;
        
        const eliminado = pilotoModel.deletePiloto(parseInt(id));
        
        if (eliminado) {
            res.json({
                success: true,
                message: 'Piloto eliminado correctamente'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Piloto no encontrado'
            });
        }
    } catch (error) {
        console.error('Error al eliminar piloto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar piloto'
        });
    }
}

/**
 * API: Actualiza el estado de un piloto
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function updatePilotoEstado(req, res) {
    try {
        const { id } = req.params;
        const { estado } = req.body;
        
        const pilotoActualizado = pilotoModel.updatePilotoEstado(parseInt(id), estado);
        
        res.json({
            success: true,
            message: 'Estado del piloto actualizado correctamente',
            data: pilotoActualizado
        });
    } catch (error) {
        console.error('Error al actualizar estado del piloto:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar estado del piloto'
        });
    }
}

/**
 * API: Obtiene estadísticas para el dashboard
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function getEstadisticas(req, res) {
    try {
        const estadisticasPilotos = pilotoModel.getEstadisticasPilotos();
        const estadisticasViajes = viajeModel.getEstadisticasViajes();
        
        res.json({
            success: true,
            data: {
                pilotos: estadisticasPilotos,
                viajes: estadisticasViajes
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas'
        });
    }
}

/**
 * API: Cancela un viaje
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function cancelarViaje(req, res) {
    try {
        const { id } = req.params;
        
        const viajeCancelado = viajeModel.cancelarViaje(parseInt(id));
        
        // Emitir evento de socket para actualizar en tiempo real
        if (req.app.get('io')) {
            req.app.get('io').to('admin').emit('viaje_actualizado', {
                ...viajeCancelado,
                accion: 'cancelado'
            });
        }
        
        res.json({
            success: true,
            message: 'Viaje cancelado correctamente',
            data: viajeCancelado
        });
    } catch (error) {
        console.error('Error al cancelar viaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al cancelar viaje'
        });
    }
}

/**
 * API: Completa un viaje
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function completarViaje(req, res) {
    try {
        const { id } = req.params;
        
        const viajeCompletado = viajeModel.completarViaje(parseInt(id));
        
        // Emitir evento de socket para actualizar en tiempo real
        if (req.app.get('io')) {
            req.app.get('io').to('admin').emit('viaje_actualizado', {
                ...viajeCompletado,
                accion: 'completado'
            });
        }
        
        res.json({
            success: true,
            message: 'Viaje completado correctamente',
            data: viajeCompletado
        });
    } catch (error) {
        console.error('Error al completar viaje:', error);
        res.status(500).json({
            success: false,
            message: 'Error al completar viaje'
        });
    }
}

/**
 * Renderiza la página de pilotos
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function pilotosPage(req, res) {
    try {
        const pilotos = pilotoModel.getAllPilotos();
        res.renderWithLayout('admin/pilotos', {
            title: 'Gestión de Pilotos - Admin MotoTaxi',
            pilotos,
            currentPage: 'pilotos'
        });
    } catch (error) {
        console.error('Error en pilotosPage:', error);
        res.status(500).render('error', { message: 'Error al cargar pilotos' });
    }
}

/**
 * Renderiza la página de viajes
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function viajesPage(req, res) {
    try {
        const viajes = viajeModel.getAllViajes();
        res.renderWithLayout('admin/viajes', {
            title: 'Gestión de Viajes - Admin MotoTaxi',
            viajes,
            currentPage: 'viajes'
        });
    } catch (error) {
        console.error('Error en viajesPage:', error);
        res.status(500).render('error', { message: 'Error al cargar viajes' });
    }
}

/**
 * Renderiza la página de monitoreo de Socket.io
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function socketMonitorPage(req, res) {
    try {
        res.renderWithLayout('admin/socket-monitor', {
            title: 'Monitor Socket.io - Admin MotoTaxi',
            currentPage: 'socket-monitor'
        });
    } catch (error) {
        console.error('Error en socketMonitorPage:', error);
        res.status(500).render('error', { message: 'Error al cargar el monitor de sockets' });
    }
}

/**
 * API: Obtiene estadísticas de Socket.io en tiempo real
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function getSocketStats(req, res) {
    try {
        // Convertir Map a objeto para JSON
        const roomsArray = [];
        socketStats.rooms.forEach((value, key) => {
            roomsArray.push({
                name: key,
                clientCount: value.clients.length,
                clients: value.clients,
                eventCount: value.events.length
            });
        });

        res.json({
            success: true,
            data: {
                activeConnections: socketStats.connections.length,
                totalConnections: socketStats.totalConnections,
                totalDisconnections: socketStats.totalDisconnections,
                rooms: roomsArray,
                recentEvents: socketStats.events.slice(0, 50) // Últimos 50 eventos
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de socket:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas de socket'
        });
    }
}
