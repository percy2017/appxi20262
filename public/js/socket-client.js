/**
 * Socket.io Client
 * Cliente para manejar conexiones en tiempo real desde el navegador
 */

// Inicializar socket.io client
const socket = io();

// Evento: Conexión establecida
socket.on('connect', () => {
    console.log('🔌 Conectado al servidor de sockets');
    
    // Unirse a la sala de admin si estamos en el dashboard
    if (window.location.pathname.includes('/admin')) {
        socket.emit('join_room', 'admin');
    }
    
    // Unirse a la sala de pilotos si estamos en la app del piloto
    if (window.location.pathname.includes('/chofer')) {
        socket.emit('join_room', 'pilotos');
    }
});

// Evento: Nueva solicitud de viaje (para pilotos y admin)
socket.on('nueva_solicitud', (data) => {
    console.log('📝 Nueva solicitud de viaje:', data);
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Nueva Solicitud de Viaje',
            text: `Origen: ${data.origen}\nDestino: ${data.destino}`,
            icon: 'info',
            confirmButtonText: 'Ver Detalles'
        }).then(() => {
            // Redireccionar o mostrar más detalles
            if (window.location.pathname.includes('/admin')) {
                window.location.reload();
            }
        });
    }
});

// Evento: Viaje aceptado (para pasajeros)
socket.on('viaje_aceptado', (data) => {
    console.log('✅ Viaje aceptado:', data);
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '¡Viaje Aceptado!',
            text: `El piloto ${data.piloto_nombre} ha aceptado tu viaje.`,
            icon: 'success'
        });
    }
});

// Evento: Ubicación del piloto actualizada (para pasajeros)
socket.on('ubicacion_piloto', (data) => {
    console.log('📍 Ubicación del piloto:', data);
    
    // Dispatch event para que el mapa lo maneje
    window.dispatchEvent(new CustomEvent('piloto_ubicacion', { detail: data }));
});

// Evento: Viaje iniciado (para pasajeros)
socket.on('viaje_iniciado', (data) => {
    console.log('🚗 Viaje iniciado:', data);
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Viaje en Curso',
            text: 'Tu viaje ha comenzado. Disfruta del viaje.',
            icon: 'info'
        });
    }
});

// Evento: Viaje completado (para pasajeros)
socket.on('viaje_completado', (data) => {
    console.log('🏁 Viaje completado:', data);
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: '¡Viaje Completado!',
            text: 'Gracias por usar nuestro servicio.',
            icon: 'success'
        });
    }
});

// Evento: Viaje cancelado
socket.on('viaje_cancelado', (data) => {
    console.log('❌ Viaje cancelado:', data);
    
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Viaje Cancelado',
            text: 'El viaje ha sido cancelado.',
            icon: 'error'
        });
    }
});

// Evento: Viaje actualizado (para admin)
socket.on('viaje_actualizado', (data) => {
    console.log('📊 Viaje actualizado:', data);
    
    if (window.location.pathname.includes('/admin')) {
        window.dispatchEvent(new CustomEvent('viaje_actualizado', { detail: data }));
    }
});

// Evento: Usuario actualizado (para admin)
socket.on('usuario_actualizado', (data) => {
    console.log('👤 Usuario actualizado:', data);
    
    if (window.location.pathname.includes('/admin')) {
        window.dispatchEvent(new CustomEvent('usuario_actualizado', { detail: data }));
    }
});

// Evento: Piloto actualizado (para admin)
socket.on('piloto_actualizado', (data) => {
    console.log('🚗 Piloto actualizado:', data);
    
    if (window.location.pathname.includes('/admin')) {
        window.dispatchEvent(new CustomEvent('piloto_actualizado', { detail: data }));
    }
});

// Evento: Pasajero actualizado (para admin)
socket.on('pasajero_actualizado', (data) => {
    console.log('🎫 Pasajero actualizado:', data);
    
    if (window.location.pathname.includes('/admin')) {
        window.dispatchEvent(new CustomEvent('pasajero_actualizado', { detail: data }));
    }
});

// Evento: Desconexión
socket.on('disconnect', () => {
    console.log('🔌 Desconectado del servidor de sockets');
});

// Funciones globales para usar en las vistas
window.joinRoom = function(room) {
    socket.emit('join_room', room);
};

window.solicitarViaje = function(data) {
    socket.emit('solicitar_viaje', data);
};

window.aceptarViaje = function(data) {
    socket.emit('aceptar_viaje', data);
};

window.actualizarUbicacion = function(data) {
    socket.emit('actualizar_ubicacion', data);
};

window.iniciarViaje = function(data) {
    socket.emit('iniciar_viaje', data);
};

window.completarViaje = function(data) {
    socket.emit('completar_viaje', data);
};

window.cancelarViaje = function(data) {
    socket.emit('cancelar_viaje', data);
};

// Exportar socket para uso global
window.socket = socket;
