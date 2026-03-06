/**
 * Controlador de Pasajeros
 * Maneja la lógica de negocio para la gestión de pasajeros en el admin
 */

import * as pasajeroModel from '../models/pasajeroModel.js';

/**
 * Renderiza la página de gestión de pasajeros
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function pasajerosPage(req, res) {
    try {
        const pasajeros = pasajeroModel.getAllPasajeros();
        const estadisticas = pasajeroModel.getEstadisticasPasajeros();
        
        res.renderWithLayout('admin/pasajeros', {
            title: 'Gestión de Pasajeros - Admin MotoTaxi',
            pasajeros,
            estadisticas,
            currentPage: 'pasajeros'
        });
    } catch (error) {
        console.error('Error en pasajerosPage:', error);
        res.status(500).render('error', { message: 'Error al cargar la página de pasajeros' });
    }
}

/**
 * API: Obtiene todos los pasajeros (para DataTables)
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function getPasajeros(req, res) {
    try {
        const pasajeros = pasajeroModel.getAllPasajeros();
        res.json({
            success: true,
            data: pasajeros
        });
    } catch (error) {
        console.error('Error al obtener pasajeros:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pasajeros'
        });
    }
}

/**
 * API: Crea un nuevo pasajero
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function createPasajero(req, res) {
    try {
        const pasajero = req.body;
        
        // Validar campos requeridos
        if (!pasajero.nombre || !pasajero.telefono) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre y teléfono son requeridos'
            });
        }
        
        const nuevoPasajero = pasajeroModel.createPasajero(pasajero);
        
        res.json({
            success: true,
            message: 'Pasajero creado correctamente',
            data: nuevoPasajero
        });
    } catch (error) {
        console.error('Error al crear pasajero:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear pasajero: ' + error.message
        });
    }
}

/**
 * API: Actualiza un pasajero
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function updatePasajero(req, res) {
    try {
        const { id } = req.params;
        const pasajero = req.body;
        
        // Convertir id a número
        const pasajeroId = parseInt(id);
        
        // Validar campos requeridos
        if (!pasajero.nombre || !pasajero.telefono) {
            return res.status(400).json({
                success: false,
                message: 'Los campos nombre y teléfono son requeridos'
            });
        }
        
        // Verificar si el pasajero existe
        const existingPasajero = pasajeroModel.getPasajeroById(pasajeroId);
        if (!existingPasajero) {
            return res.status(404).json({
                success: false,
                message: 'Pasajero no encontrado'
            });
        }
        
        const pasajeroActualizado = pasajeroModel.updatePasajero(pasajeroId, pasajero);
        
        res.json({
            success: true,
            message: 'Pasajero actualizado correctamente',
            data: pasajeroActualizado
        });
    } catch (error) {
        console.error('Error al actualizar pasajero:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar pasajero: ' + error.message
        });
    }
}

/**
 * API: Elimina un pasajero
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export function deletePasajero(req, res) {
    try {
        const { id } = req.params;
        
        // Convertir id a número
        const pasajeroId = parseInt(id);
        
        // Verificar si el pasajero existe
        const existingPasajero = pasajeroModel.getPasajeroById(pasajeroId);
        if (!existingPasajero) {
            return res.status(404).json({
                success: false,
                message: 'Pasajero no encontrado'
            });
        }
        
        const deleted = pasajeroModel.deletePasajero(pasajeroId);
        
        if (deleted) {
            res.json({
                success: true,
                message: 'Pasajero eliminado correctamente'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Error al eliminar pasajero'
            });
        }
    } catch (error) {
        console.error('Error al eliminar pasajero:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar pasajero: ' + error.message
        });
    }
}

/**
 * API: Login/Registro de pasajero desde WhatsApp
 * Obtiene datos reales del perfil de WhatsApp usando Evolution API
 * @param {Object} req - Request de Express
 * @param {Object} res - Response de Express
 */
export async function loginWhatsApp(req, res) {
    try {
        const { phone } = req.body;
        
        // Validar teléfono
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'El teléfono es requerido'
            });
        }
        
        // Limpiar número de teléfono
        let cleanNumber = phone.replace(/[\s\-\(\)]/g, '');
        let fullNumber = cleanNumber;
        if (!cleanNumber.startsWith('+') && !cleanNumber.startsWith('591')) {
            if (cleanNumber.startsWith('7') || cleanNumber.startsWith('6')) {
                fullNumber = '591' + cleanNumber;
            }
        }
        
        // Obtener datos del perfil de WhatsApp usando Evolution API
        const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://217.216.43.75:2001';
        const EVOLUTION_API_TOKEN = process.env.EVOLUTION_API_TOKEN || 'evolution2001';
        
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
            return res.status(500).json({
                success: false,
                message: 'No hay instancias de WhatsApp disponibles'
            });
        }
        
        // Obtener perfil del usuario
        const profileRes = await fetch(`${EVOLUTION_API_URL}/chat/fetchProfile/${openInstance.name}`, {
            method: 'POST',
            headers: {
                'apikey': EVOLUTION_API_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ number: fullNumber })
        });
        
        let whatsappName = 'Usuario';
        let whatsappPicture = null;
        
        if (profileRes.ok) {
            const profileData = await profileRes.json();
            whatsappName = profileData.name || 'Usuario';
            whatsappPicture = profileData.picture || null;
            
            // Si hay foto de perfil, descargarla y guardarla localmente
            if (whatsappPicture) {
                try {
                    const fs = await import('fs');
                    const path = await import('path');
                    const { URL } = await import('url');
                    
                    // Generar nombre de archivo único
                    const fileName = `pasajero_${fullNumber}_${Date.now()}.jpg`;
                    const uploadDir = path.join(process.cwd(), 'public', 'images', 'pasajeros');
                    
                    // Crear directorio si no existe
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    
                    // Descargar imagen
                    const imageRes = await fetch(whatsappPicture);
                    const imageBuffer = await imageRes.arrayBuffer();
                    const imagePath = path.join(uploadDir, fileName);
                    
                    fs.writeFileSync(imagePath, Buffer.from(imageBuffer));
                    whatsappPicture = `/images/pasajeros/${fileName}`;
                    
                    console.log('📷 Foto de perfil guardada:', whatsappPicture);
                } catch (imgError) {
                    console.error('Error al guardar imagen:', imgError);
                    whatsappPicture = null;
                }
            }
        }
        
        // Crear o actualizar pasajero con datos de WhatsApp
        const pasajero = pasajeroModel.upsertPasajero({
            telefono: fullNumber,
            nombre: whatsappName,
            avatar: whatsappPicture
        });
        
        res.json({
            success: true,
            message: 'Pasajero autenticado correctamente',
            data: pasajero
        });
    } catch (error) {
        console.error('Error en login WhatsApp:', error);
        res.status(500).json({
            success: false,
            message: 'Error al autenticar pasajero: ' + error.message
        });
    }
}
