/**
 * Controlador de Plantillas de Notificaciones
 * Maneja la gestión de plantillas de WhatsApp
 */

import * as plantillaModel from '../models/plantillaNotificacionModel.js';

/**
 * Renderiza la página de gestión de plantillas
 * GET /admin/plantillas-notificaciones
 */
export function plantillasPage(req, res) {
    try {
        const plantillas = plantillaModel.getAllPlantillas();
        
        res.renderWithLayout('admin/plantillas-notificaciones', {
            title: 'Plantillas de Notificaciones - Admin MotoTaxi',
            plantillas,
            currentPage: 'plantillas-notificaciones'
        });
    } catch (error) {
        console.error('Error en plantillasPage:', error);
        res.status(500).render('error', { message: 'Error al cargar las plantillas' });
    }
}

/**
 * API: Obtiene todas las plantillas
 * GET /admin/api/plantillas
 */
export function getPlantillas(req, res) {
    try {
        const plantillas = plantillaModel.getAllPlantillas();
        res.json({
            success: true,
            data: plantillas
        });
    } catch (error) {
        console.error('Error al obtener plantillas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener plantillas'
        });
    }
}

/**
 * API: Obtiene una plantilla por ID
 * GET /admin/api/plantillas/:id
 */
export function getPlantilla(req, res) {
    try {
        const { id } = req.params;
        const plantilla = plantillaModel.getPlantillaById(id);
        
        if (!plantilla) {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: plantilla
        });
    } catch (error) {
        console.error('Error al obtener plantilla:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener plantilla'
        });
    }
}

/**
 * API: Crea una nueva plantilla
 * POST /admin/api/plantillas
 */
export function createPlantilla(req, res) {
    try {
        const { clave, titulo, mensaje, activo } = req.body;
        
        // Validar campos requeridos
        if (!clave || !titulo || !mensaje) {
            return res.status(400).json({
                success: false,
                message: 'Los campos clave, título y mensaje son requeridos'
            });
        }
        
        // Verificar si la clave ya existe
        const existente = plantillaModel.getPlantillaByClave(clave);
        if (existente) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una plantilla con esa clave'
            });
        }
        
        const nuevaPlantilla = plantillaModel.createPlantilla({
            clave,
            titulo,
            mensaje,
            activo: activo !== undefined ? activo : 1
        });
        
        res.json({
            success: true,
            message: 'Plantilla creada correctamente',
            data: nuevaPlantilla
        });
    } catch (error) {
        console.error('Error al crear plantilla:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear plantilla: ' + error.message
        });
    }
}

/**
 * API: Actualiza una plantilla
 * PUT /admin/api/plantillas/:id
 */
export function updatePlantilla(req, res) {
    try {
        const { id } = req.params;
        const { titulo, mensaje, activo } = req.body;
        
        // Verificar si la plantilla existe
        const existente = plantillaModel.getPlantillaById(id);
        if (!existente) {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada'
            });
        }
        
        const plantillaActualizada = plantillaModel.updatePlantilla(id, {
            titulo,
            mensaje,
            activo: activo !== undefined ? activo : 1
        });
        
        res.json({
            success: true,
            message: 'Plantilla actualizada correctamente',
            data: plantillaActualizada
        });
    } catch (error) {
        console.error('Error al actualizar plantilla:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar plantilla: ' + error.message
        });
    }
}

/**
 * API: Elimina una plantilla
 * DELETE /admin/api/plantillas/:id
 */
export function deletePlantilla(req, res) {
    try {
        const { id } = req.params;
        
        // Verificar si la plantilla existe
        const existente = plantillaModel.getPlantillaById(id);
        if (!existente) {
            return res.status(404).json({
                success: false,
                message: 'Plantilla no encontrada'
            });
        }
        
        const eliminada = plantillaModel.deletePlantilla(id);
        
        if (eliminada) {
            res.json({
                success: true,
                message: 'Plantilla eliminada correctamente'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error al eliminar plantilla'
            });
        }
    } catch (error) {
        console.error('Error al eliminar plantilla:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar plantilla: ' + error.message
        });
    }
}
