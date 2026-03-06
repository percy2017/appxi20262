/**
 * Controlador de Evolution API
 * Maneja la integración con Evolution API para WhatsApp
 */

// Configuración de Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://217.216.43.75:2001';
const EVOLUTION_API_TOKEN = process.env.EVOLUTION_API_TOKEN || 'evolution2001';

// Almacén temporal de PINs (en memoria)
const pinStore = new Map();

// Variable para instancia por defecto (se guarda en memoria)
let defaultInstance = null;

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
        } else {
            error = `Error de conexión: ${response.status}`;
        }
        
        res.renderWithLayout('admin/evolution', {
            title: 'Evolution API - Admin MotoTaxi',
            instances,
            error,
            apiUrl: EVOLUTION_API_URL,
            currentPage: 'evolution'
        });
    } catch (err) {
        console.error('Error en evolutionPage:', err);
        res.renderWithLayout('admin/evolution', {
            title: 'Evolution API - Admin MotoTaxi',
            instances: [],
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
        
        res.json({
            success: true,
            data: instances
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
        
        defaultInstance = instance;
        
        res.json({
            success: true,
            message: 'Instancia guardada correctamente',
            defaultInstance: defaultInstance
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
    res.json({
        success: true,
        defaultInstance: defaultInstance
    });
}

/**
 * Obtiene la instancia a usar para enviar mensajes
 * Si hay una instancia por defecto, la usa; si no, busca una que esté "open"
 * @returns {Promise<string>} Nombre de la instancia
 */
async function getInstanceForSending() {
    // Si hay una instancia por defecto configurada, usarla
    if (defaultInstance) {
        console.log('🔀 Usando instancia por defecto:', defaultInstance);
        return defaultInstance;
    }
    
    // Si no, buscar una instancia "open"
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
        
        if (openInstance) {
            console.log('🔀 Usando instancia automática (open):', openInstance.name);
            return openInstance.name;
        }
        
        // Si no hay ninguna open, usar la primera disponible
        if (data.length > 0) {
            console.log('🔀 Usando primera instancia disponible:', data[0].name);
            return data[0].name;
        }
        
        throw new Error('No hay instancias disponibles');
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
        
        // Guardar PIN temporalmente (válido por 5 minutos)
        pinStore.set(fullNumber, {
            pin: pin,
            expires: Date.now() + 5 * 60 * 1000
        });
        
        // Enviar mensaje con el PIN
        const messageData = {
            number: fullNumber,
            text: `🔐 Tu código de verificación para MotoTaxi es: *${pin}*\n\nEste código expira en 5 minutos.`
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
