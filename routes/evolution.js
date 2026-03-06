/**
 * Rutas de Evolution API
 * Endpoints para gestionar Evolution API y autenticación de pasajeros
 */

import express from 'express';
import * as evolutionController from '../src/controllers/evolutionController.js';
import * as pasajeroModel from '../src/models/pasajeroModel.js';

const router = express.Router();

/**
 * GET /admin/evolution
 * Renderiza la página de Evolution API
 */
router.get('/admin/evolution', evolutionController.evolutionPage);

/**
 * GET /api/evolution/instances
 * API: Obtener instancias disponibles de Evolution API
 */
router.get('/api/evolution/instances', evolutionController.getInstances);

/**
 * POST /api/evolution/set-default
 * API: Guardar la instancia por defecto
 */
router.post('/api/evolution/set-default', evolutionController.setDefaultInstance);

/**
 * GET /api/evolution/default-instance
 * API: Obtener la instancia por defecto
 */
router.get('/api/evolution/default-instance', evolutionController.getDefaultInstance);

/**
 * POST /api/auth/solicitar-pin
 * API: Solicitar PIN de verificación por WhatsApp
 */
router.post('/api/auth/solicitar-pin', async (req, res) => {
    try {
        const { phone, instance } = req.body;
        
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'El teléfono es requerido'
            });
        }
        
        // La instancia es opcional - si no se proporciona, se detectará automáticamente
        const instanciaUsada = await evolutionController.enviarPinWhatsApp(phone, instance || null);
        
        res.json({
            success: true,
            message: 'PIN enviado correctamente',
            instance: instanciaUsada
        });
    } catch (error) {
        console.error('Error al solicitar PIN:', error);
        res.status(500).json({
            success: false,
            message: 'Error al enviar el PIN: ' + error.message
        });
    }
});

/**
 * POST /api/auth/verificar-pin
 * API: Verificar PIN y autenticar usuario
 */
export async function verificarPinLogin(req, res) {
    try {
        const { phone, pin } = req.body;
        
        if (!phone || !pin) {
            return res.status(400).json({
                success: false,
                message: 'Teléfono y PIN son requeridos'
            });
        }
        
        // Verificar PIN
        const pinValido = evolutionController.verificarPin(phone, pin);
        
        if (!pinValido) {
            return res.status(401).json({
                success: false,
                message: 'PIN inválido o expirado'
            });
        }
        
        // Crear o actualizar pasajero
        const pasajero = pasajeroModel.upsertPasajero({
            telefono: phone,
            nombre: 'Usuario WhatsApp',
            avatar: null
        });
        
        res.json({
            success: true,
            message: 'Pasajero autenticado correctamente',
            data: pasajero
        });
    } catch (error) {
        console.error('Error al verificar PIN:', error);
        res.status(500).json({
            success: false,
            message: 'Error al autenticar: ' + error.message
        });
    }
}

router.post('/api/auth/verificar-pin', verificarPinLogin);

export default router;
