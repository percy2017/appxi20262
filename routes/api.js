/**
 * Rutas Públicas de API
 * Endpoints accesibles sin autenticación para WebApps (Pasajero/Chofer)
 */

import express from 'express';
import * as pasajeroController from '../src/controllers/pasajeroController.js';
import * as pasajeroApiController from '../src/controllers/pasajeroApiController.js';

const router = express.Router();

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

export default router;
