/**
 * Rutas de Evolution API
 * Endpoints para gestionar Evolution API y autenticación de pasajeros
 */

import express from 'express';
import * as evolutionController from '../src/controllers/evolutionController.js';
import * as pasajeroModel from '../src/models/pasajeroModel.js';

const router = express.Router();

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
        
        // Obtener datos del perfil de WhatsApp
        let whatsappName = 'Usuario WhatsApp';
        let whatsappPicture = null;
        
        try {
            const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://217.216.43.75:2001';
            const EVOLUTION_API_TOKEN = process.env.EVOLUTION_API_TOKEN || 'evolution2001';
            
            // Limpiar número
            let cleanNumber = phone.replace(/[\s\-\(\)]/g, '');
            let fullNumber = cleanNumber;
            if (!cleanNumber.startsWith('+') && !cleanNumber.startsWith('591')) {
                if (cleanNumber.startsWith('7') || cleanNumber.startsWith('6')) {
                    fullNumber = '591' + cleanNumber;
                }
            }
            
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
            
            if (openInstance) {
                // Obtener perfil del usuario
                const profileRes = await fetch(`${EVOLUTION_API_URL}/chat/fetchProfile/${openInstance.name}`, {
                    method: 'POST',
                    headers: {
                        'apikey': EVOLUTION_API_TOKEN,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ number: fullNumber })
                });
                
                if (profileRes.ok) {
                    const profileData = await profileRes.json();
                    whatsappName = profileData.name || 'Usuario WhatsApp';
                    whatsappPicture = profileData.picture || null;
                    
                    // Si hay foto de perfil, descargarla y guardarla localmente
                    if (whatsappPicture) {
                        try {
                            const fs = await import('fs');
                            const path = await import('path');
                            
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
            }
        } catch (profileError) {
            console.error('Error al obtener perfil de WhatsApp:', profileError);
        }
        
        // Crear o actualizar pasajero con datos reales
        const pasajero = pasajeroModel.upsertPasajero({
            telefono: phone,
            nombre: whatsappName,
            avatar: whatsappPicture
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
