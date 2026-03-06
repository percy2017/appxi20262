/**
 * Rutas Públicas de API
 * Endpoints accesibles sin autenticación para WebApps (Pasajero/Chofer)
 */

import express from 'express';
import * as pasajeroController from '../src/controllers/pasajeroController.js';
import * as pasajeroApiController from '../src/controllers/pasajeroApiController.js';
import * as pasajeroModel from '../src/models/pasajeroModel.js';

const router = express.Router();

// API pública para ver pasajeros (solo para testing)
router.get('/api/debug/pasajeros', (req, res) => {
    const pasajeros = pasajeroModel.getAllPasajeros();
    res.json({ success: true, data: pasajeros });
});

// API pública para ver viajes (solo para testing)
import * as viajeModel from '../src/models/viajeModel.js';

router.get('/api/debug/viajes', (req, res) => {
    const viajes = viajeModel.getAllViajes();
    res.json({ success: true, data: viajes });
});

/**
 * POST /api/auth/login-whatsapp
 * Login/Registro de pasajero desde WhatsApp
 * Obtiene datos del perfil directamente desde WhatsApp
 */
router.post('/api/auth/login-whatsapp', pasajeroController.loginWhatsApp);

/**
 * POST /api/viajes/solicitar
 * Solicitar un nuevo viaje
 */
router.post('/api/viajes/solicitar', pasajeroApiController.solicitarViaje);

/**
 * GET /api/viajes/:id
 * Obtener estado de un viaje
 */
router.get('/api/viajes/:id', pasajeroApiController.getViaje);

/**
 * GET /api/pasajero/:id/viajes
 * Obtener historial de viajes de un pasajero
 */
router.get('/api/pasajero/:id/viajes', pasajeroApiController.getHistorialViajes);

/**
 * POST /api/resenas
 * Crear una reseña
 */
router.post('/api/resenas', pasajeroApiController.crearResena);

/**
 * POST /api/viajes/:id/oferta
 * Chofer hace oferta (acepta precio o contraoferta)
 */
router.post('/api/viajes/:id/oferta', pasajeroApiController.hacerOferta);

/**
 * POST /api/viajes/:id/confirmar
 * Pasajero confirma el viaje con el chofer
 */
router.post('/api/viajes/:id/confirmar', pasajeroApiController.confirmarViaje);

/**
 * POST /api/viajes/:id/iniciar
 * Chofer inicia el viaje (llega al origen)
 */
router.post('/api/viajes/:id/iniciar', pasajeroApiController.iniciarViaje);

/**
 * POST /api/viajes/:id/completar
 * Chofer completa el viaje
 */
router.post('/api/viajes/:id/completar', pasajeroApiController.completarViajeChofer);

/**
 * POST /api/viajes/:id/cancelar
 * Cancelar viaje
 */
router.post('/api/viajes/:id/cancelar', pasajeroApiController.cancelarViaje);

/**
 * DELETE /api/viajes/:id
 * Eliminar viaje (solo admin)
 */
router.delete('/api/viajes/:id', pasajeroApiController.eliminarViaje);

export default router;
