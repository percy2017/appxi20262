/**
 * Controlador de Evolution API
 * Maneja la integración con Evolution API para WhatsApp
 */

// Configuración de Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://217.216.43.75:2001';
const EVOLUTION_API_TOKEN = process.env.EVOLUTION_API_TOKEN || 'evolution2001';

// Importar base de datos
import db from '../config/database.js';
import * as plantillaModel from '../models/plantillaNotificacionModel.js';

// Almacén temporal de PINs (en memoria)
const pinStore = new Map();

/**
 * Obtiene la instancia por defecto guardada en la base de datos
 * @returns {string|null} Nombre de la instancia por defecto
 */
function getDefaultInstanceFromDB() {
    try {
        const row = db.prepare('SELECT valor FROM config WHERE clave = ?').get('whatsapp_default_instance');
        return row ? row.valor : null;
    } catch (error) {
        console.error('Error al obtener instancia por defecto de DB:', error);
        return null;
    }
}

/**
 * Guarda la instancia por defecto en la base de datos
 * @param {string} instanceName Nombre de la instancia
 */
function setDefaultInstanceInDB(instanceName) {
    try {
        db.prepare(`
            INSERT INTO config (clave, valor, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(clave) DO UPDATE SET valor = ?, updated_at = CURRENT_TIMESTAMP
        `).run('whatsapp_default_instance', instanceName, instanceName);
        console.log('✅ Instancia por defecto guardada en DB:', instanceName);
    } catch (error) {
        console.error('Error al guardar instancia en DB:', error);
    }
}

/**
 * Renderiza la página de Evolution API (instancias disponibles)
 * GET /admin/evolution
 */
export async function evolutionPage(req, res) {
    try {
        const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
                'apikey': EVOLUTION_API_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        let instances = [];
        let error = null;
        let defaultInstance = getDefaultInstanceFromDB();
        
        if (response.ok) {
            let data = await response.json();
            
            // El formato ya es directo: [{ name: "entel1", connectionStatus: "open", ... }]
            instances = data.map(instance => ({
                instanceName: instance.name,
                instanceId: instance.id,
                owner: instance.ownerJid,
                profileName: instance.profileName,
                profilePicUrl: instance.profilePicUrl,
                state: instance.connectionStatus,
                integration: instance.integration
            }));
            
            // Si no hay instancia por defecto guardada, guardar la primera open o la primera disponible
            if (!defaultInstance && instances.length > 0) {
                const openInstance = instances.find(i => i.state === 'open');
                const instanceToSave = openInstance ? openInstance.instanceName : instances[0].instanceName;
                setDefaultInstanceInDB(instanceToSave);
                defaultInstance = instanceToSave;
                console.log('💾 Instancia por defecto establecida:', defaultInstance);
            }
        } else {
            error = `Error de conexión: ${response.status}`;
        }
        
        res.renderWithLayout('admin/evolution', {
            title: 'Evolution API - Admin MotoTaxi',
            instances,
            defaultInstance,
            error,
            apiUrl: EVOLUTION_API_URL,
            currentPage: 'evolution'
        });
    } catch (err) {
        console.error('Error en evolutionPage:', err);
        const defaultInstance = getDefaultInstanceFromDB();
        res.renderWithLayout('admin/evolution', {
            title: 'Evolution API - Admin MotoTaxi',
            instances: [],
            defaultInstance,
            error: 'No se pudo conectar con Evolution API: ' + err.message,
            apiUrl: EVOLUTION_API_URL,
            currentPage: 'evolution'
        });
    }
}

/**
 * Obtiene las instancias disponibles de Evolution API
 * GET /api/evolution/instances
 */
export async function getInstances(req, res) {
    try {
        const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
                'apikey': EVOLUTION_API_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Evolution API error: ${response.status}`);
        }
        
        let data = await response.json();
        
        // El formato ya es directo
        const instances = data.map(instance => ({
            instanceName: instance.name,
            instanceId: instance.id,
            owner: instance.ownerJid,
            profileName: instance.profileName,
            state: instance.connectionStatus,
            integration: instance.integration
        }));
        
        // Obtener la instancia por defecto de la base de datos
        const defaultInstance = getDefaultInstanceFromDB();
        
        res.json({
            success: true,
            data: instances,
            defaultInstance: defaultInstance
        });
    } catch (error) {
        console.error('Error al obtener instancias:', error);
        res.status(500).json({
            success: false,
            message: 'Error al conectar con Evolution API'
        });
    }
}

/**
 * Guarda la instancia por defecto
 * POST /api/evolution/set-default
 */
export function setDefaultInstance(req, res) {
    try {
        const { instance } = req.body;
        
        if (!instance) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de instancia es requerido'
            });
        }
        
        // Guardar en base de datos
        setDefaultInstanceInDB(instance);
        
        res.json({
            success: true,
            message: 'Instancia guardada correctamente',
            defaultInstance: instance
        });
    } catch (error) {
        console.error('Error al guardar instancia:', error);
        res.status(500).json({
            success: false,
            message: 'Error al guardar instancia'
        });
    }
}

/**
 * Obtiene la instancia por defecto
 * GET /api/evolution/default-instance
 */
export function getDefaultInstance(req, res) {
    const defaultInstance = getDefaultInstanceFromDB();
    res.json({
        success: true,
        defaultInstance: defaultInstance
    });
}

/**
 * Obtiene la instancia a usar para enviar mensajes
 * 1. Primero verifica la DB para ver si hay una instancia por defecto guardada
 * 2. Si no hay, busca una que esté "open" en Evolution API y la guarda en DB
 * 3. Si no hay ninguna open, usa la primera disponible
 * @returns {Promise<string>} Nombre de la instancia
 */
async function getInstanceForSending() {
    // 1. Verificar si hay una instancia por defecto en la base de datos
    const defaultFromDB = getDefaultInstanceFromDB();
    if (defaultFromDB) {
        console.log('🔀 Usando instancia por defecto (DB):', defaultFromDB);
        return defaultFromDB;
    }
    
    // 2. Si no hay, buscar una instancia "open" en Evolution API
    try {
        const response = await fetch(`${EVOLUTION_API_URL}/instance/fetchInstances`, {
            method: 'GET',
            headers: {
                'apikey': EVOLUTION_API_TOKEN,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('No se pudo obtener la lista de instancias');
        }
        
        const data = await response.json();
        
        // Buscar una instancia "open"
        const openInstance = data.find(inst => inst.connectionStatus === 'open');
        
        let instanciaAUsar;
        if (openInstance) {
            console.log('🔀 Instancia open encontrada:', openInstance.name);
            instanciaAUsar = openInstance.name;
        } else if (data.length > 0) {
            // Si no hay ninguna open, usar la primera disponible
            console.log('🔀 Usando primera instancia disponible:', data[0].name);
            instanciaAUsar = data[0].name;
        } else {
            throw new Error('No hay instancias disponibles');
        }
        
        // Guardar la instancia seleccionada en la base de datos como默认值
        setDefaultInstanceInDB(instanciaAUsar);
        
        return instanciaAUsar;
    } catch (error) {
        console.error('Error al obtener instancia:', error);
        throw error;
    }
}

/**
 * Envía un PIN al número de WhatsApp del pasajero
 * @param {string} phoneNumber - Número de teléfono
 * @param {string} instanceName - Nombre de la instancia (opcional)
 * @returns {Promise<string>} Nombre de la instancia usada
 */
export async function enviarPinWhatsApp(phoneNumber, instanceName = null) {
    try {
        // Si no se especifica instancia, obtener una automáticamente
        const instanciaAUsar = instanceName || await getInstanceForSending();
        
        // Limpiar el número
        const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
        let fullNumber = cleanNumber;
        if (!cleanNumber.startsWith('+') && !cleanNumber.startsWith('591')) {
            if (cleanNumber.startsWith('7') || cleanNumber.startsWith('6')) {
                fullNumber = '591' + cleanNumber;
            }
        }
        
        // Generar PIN de 6 dígitos
        const pin = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar PIN temporalmente (válido por N minutos desde .env)
        const PIN_EXPIRY_MINUTES = parseInt(process.env.PIN_EXPIRY_MINUTES || '5');
        pinStore.set(fullNumber, {
            pin: pin,
            expires: Date.now() + PIN_EXPIRY_MINUTES * 60 * 1000
        });
        
        // Obtener plantilla de la base de datos o usar mensaje por defecto
        let mensaje = '';
        const MONEDA = process.env.MONEDA || 'Bs';
        
        try {
            const plantilla = plantillaModel.getPlantillaByClave('pin_verificacion');
            if (plantilla && plantilla.activo) {
                mensaje = plantillaModel.renderPlantilla(plantilla.mensaje, {
                    pin: pin,
                    minutos: PIN_EXPIRY_MINUTES.toString(),
                    moneda: MONEDA
                });
            } else {
                // Fallback al mensaje por defecto
                mensaje = `🔐 Tu código de verificación para MotoTaxi es: *${pin}*\n\nEste código expira en ${PIN_EXPIRY_MINUTES} minutos.`;
            }
        } catch (e) {
            // Fallback si falla la consulta
            mensaje = `🔐 Tu código de verificación para MotoTaxi es: *${pin}*\n\nEste código expira en ${PIN_EXPIRY_MINUTES} minutos.`;
        }
        
        // Enviar mensaje con el PIN
        const messageData = {
            number: fullNumber,
            text: mensaje
        };
        
        console.log('📤 Enviando PIN con instancia:', instanciaAUsar);
        
        const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${instanciaAUsar}`, {
            method: 'POST',
            headers: {
                'apikey': EVOLUTION_API_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(messageData)
        });
        
        if (!response.ok) {
            throw new Error(`Evolution API error: ${response.status}`);
        }
        
        console.log(`📱 PIN enviado a ${fullNumber}: ${pin}`);
        return instanciaAUsar;
    } catch (error) {
        console.error('Error al enviar PIN:', error);
        throw error;
    }
}

/**
 * Verifica el PIN ingresado por el usuario
 * @param {string} phoneNumber - Número de teléfono
 * @param {string} pinIngresado - PIN ingresado
 * @returns {boolean} true si el PIN es válido
 */
export function verificarPin(phoneNumber, pinIngresado) {
    const cleanNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');
    let fullNumber = cleanNumber;
    if (!cleanNumber.startsWith('+') && !cleanNumber.startsWith('591')) {
        if (cleanNumber.startsWith('7') || cleanNumber.startsWith('6')) {
            fullNumber = '591' + cleanNumber;
        }
    }
    
    const pinData = pinStore.get(fullNumber);
    if (!pinData) {
        return false;
    }
    
    // Verificar si expiró
    if (Date.now() > pinData.expires) {
        pinStore.delete(fullNumber);
        return false;
    }
    
    // Verificar PIN
    if (pinData.pin === pinIngresado) {
        pinStore.delete(fullNumber); // Eliminar después de usar
        return true;
    }
    
    return false;
}
