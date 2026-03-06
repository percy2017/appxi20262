/**
 * Configuración de Socket.io
 * Maneja las conexiones en tiempo real del sistema
 */

import { Server } from 'socket.io';

// Almacén global para estadísticas de sockets (para el panel de monitoreo)
export const socketStats = {
    connections: [],
    rooms: new Map(), // rooms.get(roomName) = { clients: [], events: [] }
    events: [], // Historial de eventos recientes
    totalConnections: 0,
    totalDisconnections: 0
};

/**
 * Registra un evento en el historial
 */
function logEvent(type, room, event, data = null) {
    const eventLog = {
        timestamp: new Date().toISOString(),
        type, // 'connection', 'disconnection', 'join', 'leave', 'event_in', 'event_out'
        room,
        event,
        data: data ? (typeof data === 'object' ? { ...data } : data) : null
    };
    
    // Agregar al historial (máximo 500 eventos)
    socketStats.events.unshift(eventLog);
    if (socketStats.events.length > 500) {
        socketStats.events.pop();
    }
    
    // Emitir evento de monitoreo al admin
    if (global.io) {
        global.io.to('admin').to('monitor').emit('socket_event', eventLog);
    }
}

/**
 * Inicializa Socket.io con el servidor HTTP
 * @param {Object} server - Servidor HTTP de Node.js
 * @returns {Server} Instancia de Socket.io
 */
export function initializeSocket(server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    
    // Guardar referencia global para usar en logEvent
    global.io = io;

    // Middleware para logging de conexiones
    io.on('connection', (socket) => {
        console.log(`🔌 Cliente conectado: ${socket.id}`);
        
        // Registrar conexión
        socketStats.connections.push({
            id: socket.id,
            connectedAt: new Date().toISOString(),
            rooms: []
        });
        socketStats.totalConnections++;
        logEvent('connection', null, 'connect', { socketId: socket.id });

        // Unirse a sala de monitoreo
        socket.join('monitor');

        // Evento: Unirse a una sala
        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`📱 Cliente ${socket.id} se unió a la sala: ${room}`);
            
            // Agregar a la sala en stats
            if (!socketStats.rooms.has(room)) {
                socketStats.rooms.set(room, { clients: [], events: [] });
            }
            const roomData = socketStats.rooms.get(room);
            if (!roomData.clients.includes(socket.id)) {
                roomData.clients.push(socket.id);
            }
            
            // Actualizar info del socket
            const conn = socketStats.connections.find(c => c.id === socket.id);
            if (conn && !conn.rooms.includes(room)) {
                conn.rooms.push(room);
            }
            
            logEvent('join', room, 'join_room', { socketId: socket.id, room });
        });

        // Evento: Solicitar viaje (pasajero)
        socket.on('solicitar_viaje', (data) => {
            console.log('📝 Solicitud de viaje recibida:', data);
            logEvent('event_in', 'pilotos', 'solicitar_viaje', data);
            // Emitir a todos los pilotos
            io.to('pilotos').emit('nueva_solicitud', data);
            logEvent('event_out', 'pilotos', 'nueva_solicitud', data);
            // Emitir al admin
            io.to('admin').emit('nueva_solicitud', data);
            logEvent('event_out', 'admin', 'nueva_solicitud', data);
        });

        // Evento: Aceptar viaje (piloto)
        socket.on('aceptar_viaje', (data) => {
            console.log('✅ Viaje aceptado:', data);
            logEvent('event_in', 'pasajero_*', 'aceptar_viaje', data);
            // Notificar al pasajero
            io.to(`pasajero_${data.pasajero_id}`).emit('viaje_aceptado', data);
            logEvent('event_out', `pasajero_${data.pasajero_id}`, 'viaje_aceptado', data);
            // Notificar al admin
            io.to('admin').emit('viaje_actualizado', data);
            logEvent('event_out', 'admin', 'viaje_actualizado', data);
        });

        // Evento: Actualizar ubicación (piloto)
        socket.on('actualizar_ubicacion', (data) => {
            logEvent('event_in', 'ubicacion', 'actualizar_ubicacion', data);
            // Notificar al pasajero del viaje activo
            if (data.pasajero_id) {
                io.to(`pasajero_${data.pasajero_id}`).emit('ubicacion_piloto', data);
                logEvent('event_out', `pasajero_${data.pasajero_id}`, 'ubicacion_piloto', data);
            }
            // Notificar al admin
            io.to('admin').emit('ubicacion_piloto_actualizada', data);
            logEvent('event_out', 'admin', 'ubicacion_piloto_actualizada', data);
        });

        // Evento: Iniciar viaje
        socket.on('iniciar_viaje', (data) => {
            console.log('🚗 Viaje iniciado:', data);
            logEvent('event_in', 'viaje', 'iniciar_viaje', data);
            io.to(`pasajero_${data.pasajero_id}`).emit('viaje_iniciado', data);
            logEvent('event_out', `pasajero_${data.pasajero_id}`, 'viaje_iniciado', data);
            io.to('admin').emit('viaje_actualizado', data);
            logEvent('event_out', 'admin', 'viaje_actualizado', data);
        });

        // Evento: Completar viaje
        socket.on('completar_viaje', (data) => {
            console.log('🏁 Viaje completado:', data);
            logEvent('event_in', 'viaje', 'completar_viaje', data);
            io.to(`pasajero_${data.pasajero_id}`).emit('viaje_completado', data);
            logEvent('event_out', `pasajero_${data.pasajero_id}`, 'viaje_completado', data);
            io.to('admin').emit('viaje_actualizado', data);
            logEvent('event_out', 'admin', 'viaje_actualizado', data);
        });

        // Evento: Cancelar viaje
        socket.on('cancelar_viaje', (data) => {
            console.log('❌ Viaje cancelado:', data);
            logEvent('event_in', 'viaje', 'cancelar_viaje', data);
            io.to(`pasajero_${data.pasajero_id}`).emit('viaje_cancelado', data);
            logEvent('event_out', `pasajero_${data.pasajero_id}`, 'viaje_cancelado', data);
            io.to('admin').emit('viaje_actualizado', data);
            logEvent('event_out', 'admin', 'viaje_actualizado', data);
        });

        // Evento: Desconexión
        socket.on('disconnect', () => {
            console.log(`🔌 Cliente desconectado: ${socket.id}`);
            
            // Actualizar stats
            const connIndex = socketStats.connections.findIndex(c => c.id === socket.id);
            if (connIndex !== -1) {
                const conn = socketStats.connections[connIndex];
                // Remover de todas las salas
                conn.rooms.forEach(room => {
                    const roomData = socketStats.rooms.get(room);
                    if (roomData) {
                        roomData.clients = roomData.clients.filter(id => id !== socket.id);
                    }
                });
                socketStats.connections.splice(connIndex, 1);
            }
            socketStats.totalDisconnections++;
            logEvent('disconnection', null, 'disconnect', { socketId: socket.id });
        });
    });

    console.log('✅ Socket.io inicializado correctamente');
    return io;
}

/**
 * Envía un evento a una sala específica
 * @param {Object} io - Instancia de Socket.io
 * @param {string} room - Nombre de la sala
 * @param {string} event - Nombre del evento
 * @param {Object} data - Datos a enviar
 */
export function emitToRoom(io, room, event, data) {
    io.to(room).emit(event, data);
}

/**
 * Envía un evento a todos los clientes conectados
 * @param {Object} io - Instancia de Socket.io
 * @param {string} event - Nombre del evento
 * @param {Object} data - Datos a enviar
 */
export function emitToAll(io, event, data) {
    io.emit(event, data);
}
