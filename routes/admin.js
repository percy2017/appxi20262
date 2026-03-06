/**
 * Rutas del Admin
 * Define los endpoints para el panel de administración
 */

import express from 'express';
import * as adminController from '../src/controllers/adminController.js';
import * as usuarioController from '../src/controllers/usuarioController.js';
import * as pasajeroController from '../src/controllers/pasajeroController.js';
import * as pasajeroApiController from '../src/controllers/pasajeroApiController.js';
import * as authController from '../src/controllers/authController.js';

const router = express.Router();

// Rutas de autenticación (SIN protección - deben estar antes del middleware)
router.get('/login', authController.loginPage);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

// Middleware para verificar autenticación en todas las demás rutas de admin
router.use(authController.requireAuth);

/**
 * GET /admin
 * Renderiza el dashboard principal del admin
 */
router.get('/', adminController.dashboard);

/**
 * GET /admin/socket-monitor
 * Renderiza la página de monitoreo de Socket.io
 */
router.get('/socket-monitor', adminController.socketMonitorPage);

/**
 * GET /admin/api/socket-stats
 * API: Obtiene estadísticas en tiempo real de Socket.io
 */
router.get('/api/socket-stats', adminController.getSocketStats);

/**
 * GET /admin/pilotos
 * Renderiza la página de gestión de pilotos
 */
router.get('/pilotos', adminController.pilotosPage);

/**
 * GET /admin/viajes
 * Renderiza la página de gestión de viajes
 */
router.get('/viajes', adminController.viajesPage);

/**
 * GET /admin/api/pilotos
 * API: Obtiene todos los pilotos
 */
router.get('/api/pilotos', adminController.getPilotos);

/**
 * GET /admin/api/viajes
 * API: Obtiene todos los viajes
 */
router.get('/api/viajes', adminController.getViajes);

/**
 * GET /admin/api/estadisticas
 * API: Obtiene estadísticas del dashboard
 */
router.get('/api/estadisticas', adminController.getEstadisticas);

/**
 * POST /admin/api/pilotos
 * API: Crea un nuevo piloto
 */
router.post('/api/pilotos', adminController.createPiloto);

/**
 * PUT /admin/api/pilotos/:id
 * API: Actualiza un piloto
 */
router.put('/api/pilotos/:id', adminController.updatePiloto);

/**
 * PATCH /admin/api/pilotos/:id/estado
 * API: Actualiza el estado de un piloto
 */
router.patch('/api/pilotos/:id/estado', adminController.updatePilotoEstado);

/**
 * DELETE /admin/api/pilotos/:id
 * API: Elimina un piloto
 */
router.delete('/api/pilotos/:id', adminController.deletePiloto);

/**
 * POST /admin/api/viajes/:id/cancelar
 * API: Cancela un viaje
 */
router.post('/api/viajes/:id/cancelar', adminController.cancelarViaje);

/**
 * POST /admin/api/viajes/:id/completar
 * API: Completa un viaje
 */
router.post('/api/viajes/:id/completar', adminController.completarViaje);

/**
 * GET /admin/usuarios
 * Renderiza la página de gestión de usuarios
 */
router.get('/usuarios', usuarioController.usuariosPage);

/**
 * GET /admin/api/usuarios
 * API: Obtiene todos los usuarios
 */
router.get('/api/usuarios', usuarioController.getUsuarios);

/**
 * POST /admin/api/usuarios
 * API: Crea un nuevo usuario
 */
router.post('/api/usuarios', usuarioController.createUsuario);

/**
 * PUT /admin/api/usuarios/:id
 * API: Actualiza un usuario
 */
router.put('/api/usuarios/:id', usuarioController.updateUsuario);

/**
 * DELETE /admin/api/usuarios/:id
 * API: Elimina un usuario
 */
router.delete('/api/usuarios/:id', usuarioController.deleteUsuario);

/**
 * GET /admin/api/usuarios/estadisticas
 * API: Obtiene estadísticas de usuarios
 */
router.get('/api/usuarios/estadisticas', usuarioController.getEstadisticas);

/**
 * GET /admin/pasajeros
 * Renderiza la página de gestión de pasajeros
 */
router.get('/pasajeros', pasajeroController.pasajerosPage);

/**
 * GET /admin/api/pasajeros
 * API: Obtiene todos los pasajeros
 */
router.get('/api/pasajeros', pasajeroController.getPasajeros);

/**
 * POST /admin/api/pasajeros
 * API: Crea un nuevo pasajero
 */
router.post('/api/pasajeros', pasajeroController.createPasajero);

/**
 * PUT /admin/api/pasajeros/:id
 * API: Actualiza un pasajero
 */
router.put('/api/pasajeros/:id', pasajeroController.updatePasajero);

/**
 * DELETE /admin/api/pasajeros/:id
 * API: Elimina un pasajero
 */
router.delete('/api/pasajeros/:id', pasajeroController.deletePasajero);

/**
 * POST /api/auth/login-whatsapp
 * API: Login/Registro de pasajero desde WhatsApp (legacy)
 */
router.post('/api/auth/login-whatsapp', pasajeroController.loginWhatsApp);

/**
 * POST /api/viajes/solicitar
 * API: Solicitar un nuevo viaje
 */
router.post('/api/viajes/solicitar', pasajeroApiController.solicitarViaje);

/**
 * GET /api/viajes/:id
 * API: Obtener estado de un viaje
 */
router.get('/api/viajes/:id', pasajeroApiController.getViaje);

/**
 * GET /api/pasajero/:id/viajes
 * API: Obtener historial de viajes de un pasajero
 */
router.get('/api/pasajero/:id/viajes', pasajeroApiController.getHistorialViajes);

/**
 * POST /api/resenas
 * API: Crear una reseña
 */
router.post('/api/resenas', pasajeroApiController.crearResena);

/**
 * POST /api/viajes/:id/oferta
 * API: Chofer hace oferta (acepta precio o contraoferta)
 */
router.post('/api/viajes/:id/oferta', pasajeroApiController.hacerOferta);

/**
 * POST /api/viajes/:id/confirmar
 * API: Pasajero confirma el viaje con el chofer
 */
router.post('/api/viajes/:id/confirmar', pasajeroApiController.confirmarViaje);

/**
 * POST /api/viajes/:id/iniciar
 * API: Chofer inicia el viaje (llega al origen)
 */
router.post('/api/viajes/:id/iniciar', pasajeroApiController.iniciarViaje);

/**
 * POST /api/viajes/:id/completar
 * API: Chofer completa el viaje
 */
router.post('/api/viajes/:id/completar', pasajeroApiController.completarViajeChofer);

/**
 * POST /api/viajes/:id/cancelar
 * API: Cancelar viaje
 */
router.post('/api/viajes/:id/cancelar', pasajeroApiController.cancelarViaje);

export default router;
