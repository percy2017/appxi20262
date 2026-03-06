/**
 * Dashboard Admin - Funciones para actualización en tiempo real
 * Maneja la actualización de todas las tablas del admin via Socket.io
 */

// Almacena las instancias de DataTables
const dataTablesInstances = {};

// Configuración de tablas
const tableConfigs = {
    usuarios: {
        tableId: 'usuariosTable',
        apiEndpoint: '/admin/api/usuarios',
        columns: [
            { data: 'id', title: 'ID' },
            { data: 'avatar', title: 'Avatar', render: renderAvatar },
            { data: 'username', title: 'Usuario' },
            { data: 'nombre', title: 'Nombre' },
            { data: 'telefono', title: 'Teléfono' },
            { data: 'email', title: 'Email' },
            { data: 'rol', title: 'Rol', render: renderRol },
            { data: 'id', title: 'Acciones', render: renderAccionesUsuario, orderable: false }
        ]
    },
    pilotos: {
        tableId: 'pilotosTable',
        apiEndpoint: '/admin/api/pilotos',
        columns: [
            { data: 'id', title: 'ID' },
            { data: 'foto', title: 'Foto', render: renderFotoPiloto },
            { data: 'nombre', title: 'Nombre' },
            { data: 'telefono', title: 'Teléfono' },
            { data: 'licencia', title: 'Licencia' },
            { data: 'placa', title: 'Placa', render: renderPlaca },
            { data: 'modelo', title: 'Vehículo', render: renderVehiculo },
            { data: 'foto_vehiculo', title: 'Foto Vehículo', render: renderFotoVehiculo },
            { data: 'estado', title: 'Estado', render: renderEstadoPiloto },
            { data: 'id', title: 'Acciones', render: renderAccionesPiloto, orderable: false }
        ]
    },
    pasajeros: {
        tableId: 'pasajerosTable',
        apiEndpoint: '/admin/api/pasajeros',
        columns: [
            { data: 'id', title: 'ID' },
            { data: 'avatar', title: 'Avatar', render: renderAvatarPasajero },
            { data: 'nombre', title: 'Nombre' },
            { data: 'telefono', title: 'Teléfono' },
            { data: 'email', title: 'Email' },
            { data: 'direccion', title: 'Dirección' },
            { data: 'id', title: 'Acciones', render: renderAccionesPasajero, orderable: false }
        ]
    },
    viajes: {
        tableId: 'viajesTable',
        apiEndpoint: '/admin/api/viajes',
        columns: [
            { data: 'id', title: 'ID', render: (data) => `<strong>#${data}</strong>` },
            { data: 'pasajero_nombre', title: 'Pasajero', render: renderPasajero },
            { data: 'piloto_nombre', title: 'Piloto', render: renderPiloto },
            { data: 'origen_direccion', title: 'Origen', render: renderDireccionCorta },
            { data: 'destino_direccion', title: 'Destino', render: renderDireccionCorta },
            { data: 'distancia', title: 'Distancia', render: renderDistancia },
            { data: 'precio', title: 'Precio', render: renderPrecio },
            { data: 'estado', title: 'Estado', render: renderEstadoViaje },
            { data: 'fecha_solicitud', title: 'Fecha Solicitud', render: renderFecha },
            { data: 'id', title: 'Acciones', render: renderAccionesViaje, orderable: false }
        ]
    }
};

/**
 * Inicializa una tabla DataTables con AJAX
 * @param {string} tableName - Nombre de la tabla (usuarios, pilotos, pasajeros, viajes)
 */
function initDataTable(tableName) {
    const config = tableConfigs[tableName];
    if (!config) return;

    const tableElement = document.getElementById(config.tableId);
    if (!tableElement) return;

    // Verificar si ya está inicializada - si es así, solo obtener la referencia
    if ($.fn.DataTable.isDataTable(`#${config.tableId}`)) {
        console.log(`La tabla ${tableName} ya está inicializada, obteniendo referencia...`);
        dataTablesInstances[tableName] = $(`#${config.tableId}`).DataTable();
        return dataTablesInstances[tableName];
    }

    const table = $(`#${config.tableId}`).DataTable({
        ajax: {
            url: config.apiEndpoint,
            dataSrc: 'data',
            error: function(xhr, error, thrown) {
                console.error(`Error cargando ${tableName}:`, error);
                mostrarNotificacion(`Error al cargar ${tableName}`, 'error');
            }
        },
        columns: config.columns,
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        order: [[0, 'desc']],
        processing: true,
        serverSide: false,
        responsive: true
    });

    dataTablesInstances[tableName] = table;
    return table;
}

/**
 * Recarga una tabla específica
 * @param {string} tableName - Nombre de la tabla
 */
function recargarTabla(tableName) {
    const table = dataTablesInstances[tableName];
    if (table) {
        table.ajax.reload(null, false); // false = mantener paginación actual
    }
}

/**
 * Muestra notificación toast
 * @param {string} mensaje - Mensaje a mostrar
 * @param {string} tipo - Tipo de notificación (success, error, info, warning)
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: tipo,
        title: mensaje
    });
}

// ============================================
// FUNCIONES DE RENDERIZADO PARA CADA TABLA
// ============================================

// Render avatar usuario
function renderAvatar(data, type, row) {
    if (data) {
        return `<img src="${data}" alt="Avatar" class="rounded-circle" width="40" height="40" style="object-fit: cover;">`;
    }
    const colors = { administrador: '#dc3545', chofer: '#198754', pasajero: '#0dcaf0' };
    const color = colors[row.rol] || '#6c757d';
    const inicial = row.nombre ? row.nombre.charAt(0).toUpperCase() : 'U';
    return `<div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width:40px;height:40px; background: ${color};">${inicial}</div>`;
}

// Render rol
function renderRol(data) {
    const icons = { administrador: '👤', chofer: '🚗', pasajero: '🎫' };
    const colors = { administrador: 'danger', chofer: 'success', pasajero: 'info' };
    return `<span class="badge bg-${colors[data] || 'secondary'}">${icons[data] || ''} ${data ? data.charAt(0).toUpperCase() + data.slice(1) : data}</span>`;
}

// Render acciones usuario
function renderAccionesUsuario(data) {
    return `<div class="btn-group btn-group-sm" role="group">
        <button class="btn btn-outline-warning" onclick="editarUsuario(${data})" title="Editar"><i class="bi bi-pencil-fill"></i></button>
        <button class="btn btn-outline-danger" onclick="eliminarUsuario(${data})" title="Eliminar"><i class="bi bi-trash-fill"></i></button>
    </div>`;
}

// Render foto piloto
function renderFotoPiloto(data, type, row) {
    if (data) {
        return `<img src="${data}" alt="Foto" class="rounded-circle" width="40" height="40" style="object-fit: cover;">`;
    }
    const color = row.estado === 'disponible' ? '#198754' : row.estado === 'ocupado' ? '#dc3545' : '#6c757d';
    const inicial = row.nombre ? row.nombre.charAt(0).toUpperCase() : 'P';
    return `<div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width:40px;height:40px; background: ${color};">${inicial}</div>`;
}

// Render placa
function renderPlaca(data) {
    return `<span class="badge bg-dark">${data || '-'}</span>`;
}

// Render vehículo
function renderVehiculo(data, type, row) {
    let html = data || '-';
    if (row.color) {
        const textColor = ['#ffffff', '#ffff00', '#f0f0f0'].includes(row.color) ? '#000' : '#fff';
        html += ` <span class="badge ms-1" style="background-color: ${row.color}; color: ${textColor};"><i class="bi bi-palette-fill"></i></span>`;
    }
    return html;
}

// Render foto vehículo
function renderFotoVehiculo(data) {
    if (data) {
        return `<img src="${data}" alt="Vehículo" class="rounded" width="60" height="40" style="object-fit: cover;">`;
    }
    return '<span class="text-muted">-</span>';
}

// Render estado piloto
function renderEstadoPiloto(data) {
    const icons = { disponible: '✅', ocupado: '🔴', inactivo: '⚪' };
    const colors = { disponible: 'success', ocupado: 'danger', inactivo: 'secondary' };
    return `<span class="badge bg-${colors[data] || 'secondary'}">${icons[data] || ''} ${data ? data.charAt(0).toUpperCase() + data.slice(1) : data}</span>`;
}

// Render acciones piloto
function renderAccionesPiloto(data) {
    return `<div class="btn-group btn-group-sm" role="group">
        <button class="btn btn-outline-warning" onclick="editarPiloto(${data})" title="Editar"><i class="bi bi-pencil-fill"></i></button>
        <button class="btn btn-outline-danger" onclick="eliminarPiloto(${data})" title="Eliminar"><i class="bi bi-trash-fill"></i></button>
    </div>`;
}

// Render avatar pasajero
function renderAvatarPasajero(data, type, row) {
    if (data) {
        return `<img src="${data}" alt="Avatar" class="rounded-circle" width="40" height="40" style="object-fit: cover;">`;
    }
    const inicial = row.nombre ? row.nombre.charAt(0).toUpperCase() : 'P';
    return `<div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold" style="width:40px;height:40px; background: #0dcaf0;">${inicial}</div>`;
}

// Render acciones pasajero
function renderAccionesPasajero(data) {
    return `<div class="btn-group btn-group-sm" role="group">
        <button class="btn btn-outline-warning" onclick="editarPasajero(${data})" title="Editar"><i class="bi bi-pencil-fill"></i></button>
        <button class="btn btn-outline-danger" onclick="eliminarPasajero(${data})" title="Eliminar"><i class="bi bi-trash-fill"></i></button>
    </div>`;
}

// Render pasajero en tabla viajes
function renderPasajero(data, type, row) {
    if (data) {
        const inicial = data.charAt(0).toUpperCase();
        return `<div class="d-flex align-items-center">
            <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2" style="width:32px;height:32px; background: #0dcaf0;">${inicial}</div>
            <div>
                <div class="fw-semibold">${data}</div>
                <small class="text-muted">${row.pasajero_telefono || '-'}</small>
            </div>
        </div>`;
    }
    return '<span class="text-muted">-</span>';
}

// Render piloto en tabla viajes
function renderPiloto(data, type, row) {
    if (data) {
        const inicial = data.charAt(0).toUpperCase();
        return `<div class="d-flex align-items-center">
            <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2" style="width:32px;height:32px; background: #198754;">${inicial}</div>
            <div>
                <div class="fw-semibold">${data}</div>
                <small class="text-muted">${row.piloto_telefono || '-'}</small>
            </div>
        </div>`;
    }
    return '<span class="badge bg-secondary">Sin asignar</span>';
}

// Render dirección corta
function renderDireccionCorta(data) {
    if (data) {
        const corta = data.length > 30 ? data.substring(0, 30) + '...' : data;
        return `<small>${corta}</small>`;
    }
    return '<span class="text-muted">-</span>';
}

// Render distancia
function renderDistancia(data) {
    if (data) {
        return `<span class="badge bg-light text-dark">${data.toFixed(2)} km</span>`;
    }
    return '<span class="text-muted">-</span>';
}

// Render precio
function renderPrecio(data) {
    if (data) {
        const moneda = typeof window !== 'undefined' ? (window.MONEDA || 'Bs') : 'Bs';
        return `<strong class="text-success">${moneda} ${data.toFixed(2)}</strong>`;
    }
    return '<span class="text-muted">-</span>';
}

// Render estado viaje
function renderEstadoViaje(data) {
    const estados = {
        pendiente: { badge: 'warning', icon: '⏳', texto: 'Pendiente' },
        aceptado: { badge: 'info', icon: '✅', texto: 'Aceptado' },
        encurso: { badge: 'primary', icon: '🚗', texto: 'En Curso' },
        completado: { badge: 'success', icon: '🎉', texto: 'Completado' },
        cancelado: { badge: 'danger', icon: '❌', texto: 'Cancelado' }
    };
    const estado = estados[data] || { badge: 'secondary', icon: '⚪', texto: data };
    return `<span class="badge bg-${estado.badge}">${estado.icon} ${estado.texto}</span>`;
}

// Render fecha
function renderFecha(data) {
    if (data) {
        const fecha = new Date(data);
        return `<small>${fecha.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric' })}<br>${fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</small>`;
    }
    return '<span class="text-muted">-</span>';
}

// Render acciones viaje
function renderAccionesViaje(data, type, row) {
    let botones = `<button class="btn btn-outline-info btn-sm" onclick="verViaje(${data})" title="Ver Detalles"><i class="bi bi-eye-fill"></i></button>`;
    
    if (row.estado === 'pendiente' || row.estado === 'aceptado') {
        botones += ` <button class="btn btn-outline-danger btn-sm" onclick="cancelarViaje(${data})" title="Cancelar"><i class="bi bi-x-circle-fill"></i></button>`;
    }
    
    if (row.estado === 'aceptado' || row.estado === 'encurso') {
        botones += ` <button class="btn btn-outline-success btn-sm" onclick="completarViaje(${data})" title="Completar"><i class="bi bi-check-circle-fill"></i></button>`;
    }
    
    return `<div class="btn-group btn-group-sm" role="group">${botones}</div>`;
}

// ============================================
// INICIALIZACIÓN Y LISTENERS DE SOCKET.IO
// ============================================

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Unirse a la sala de admin
    if (typeof socket !== 'undefined' && window.location.pathname.includes('/admin')) {
        socket.emit('join_room', 'admin');
        
        // Escuchar eventos de socket para cada tabla
        socket.on('connect', () => {
            console.log('🔌 Conectado al servidor de sockets');
            socket.emit('join_room', 'admin');
           // mostrarNotificacion('Conectado en tiempo real', 'success');
        });
        
        socket.on('disconnect', () => {
            console.log('🔌 Desconectado del servidor de sockets');
            mostrarNotificacion('Desconectado del servidor', 'error');
        });
    }

    // Detectar qué tabla estamos viendo
    // Solo inicializar con AJAX la tabla de viajes (las otras usan renderizado del servidor)
    const path = window.location.pathname;
    
    if (path.includes('/viajes')) {
        initDataTable('viajes');
        console.log('🚀 Inicializando tabla de viajes con AJAX');
    }
    // Las otras tablas (usuarios, pilotos, pasajeros) ya tienen su propia inicialización en sus archivos EJS
    // Solo necesitamos agregar los listeners de socket y las funciones de recarga

    // ============================================
    // LISTENERS PARA ACTUALIZACIONES EN TIEMPO REAL
    // ============================================

    // Viajes
    window.addEventListener('viaje_actualizado', (e) => {
        const data = e.detail;
        console.log('🔄 Actualizando tabla de viajes...', data);
        
        if (window.location.pathname.includes('/viajes')) {
            recargarTabla('viajes');
            
            // Notificar según el tipo de cambio
            if (data.estado === 'completado') {
                mostrarNotificacion('🎉 Un viaje ha sido completado', 'success');
            } else if (data.estado === 'cancelado') {
                mostrarNotificacion('❌ Un viaje ha sido cancelado', 'warning');
            } else if (data.estado === 'aceptado') {
                mostrarNotificacion('✅ Un viaje ha sido aceptado', 'info');
            } else if (data.estado === 'encurso') {
                mostrarNotificacion('🚗 Un viaje ha iniciado', 'info');
            }
        }
    });

    // Escuchar evento global de nueva solicitud
    window.addEventListener('nueva_solicitud', (e) => {
        const data = e.detail;
        console.log('📝 Nueva solicitud de viaje:', data);
        
        if (window.location.pathname.includes('/viajes')) {
            recargarTabla('viajes');
            mostrarNotificacion('📝 Nueva solicitud de viaje', 'info');
        }
    });

    // Usuarios - las otras tablas usan renderizado del servidor, así que solo notificamos
    window.addEventListener('usuario_actualizado', (e) => {
        const data = e.detail;
        console.log('🔄 Evento de usuario actualizado...', data);
        
        if (window.location.pathname.includes('/usuarios')) {
            // Recargar la página para ver los cambios
            setTimeout(() => location.reload(), 1000);
            mostrarNotificacion('👤 Usuario actualizado - recargando...', 'info');
        }
    });

    // Pilotos
    window.addEventListener('piloto_actualizado', (e) => {
        const data = e.detail;
        console.log('🔄 Evento de piloto actualizado...', data);
        
        if (window.location.pathname.includes('/pilotos')) {
            setTimeout(() => location.reload(), 1000);
            mostrarNotificacion('🚗 Piloto actualizado - recargando...', 'info');
        }
    });

    // Pasajeros
    window.addEventListener('pasajero_actualizado', (e) => {
        const data = e.detail;
        console.log('🔄 Evento de pasajero actualizado...', data);
        
        if (window.location.pathname.includes('/pasajeros')) {
            setTimeout(() => location.reload(), 1000);
            mostrarNotificacion('🎫 Pasajero actualizado - recargando...', 'info');
        }
    });
});

// Funciones globales para recargar tablas manualmente
// Viajes usa AJAX, las otras tablas recargan la página
window.recargarViajes = function() { 
    recargarTabla('viajes'); 
    // También recargar datos locales para el modal
    if (typeof cargarViajesData === 'function') {
        cargarViajesData();
    }
};

// Las otras tablas usan renderizado del servidor, recargamos la página
window.recargarUsuarios = function() { location.reload(); };
window.recargarPilotos = function() { location.reload(); };
window.recargarPasajeros = function() { location.reload(); };
