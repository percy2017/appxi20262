/**
 * Script de Inicialización de Base de Datos
 * Crea las tablas necesarias para el sistema de mototaxi
 */

import db from '../config/database.js';

/**
 * Función para crear todas las tablas de la base de datos
 */
export function initializeDatabase() {
    try {
        // Tabla de usuarios (administradores)
        db.exec(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nombre TEXT NOT NULL,
                email TEXT,
                telefono TEXT,
                avatar TEXT,
                rol TEXT DEFAULT 'administrador',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Agregar campos faltantes si no existen (para bases de datos existentes)
        try {
            db.exec("ALTER TABLE usuarios ADD COLUMN telefono TEXT");
        } catch (e) {}
        try {
            db.exec("ALTER TABLE usuarios ADD COLUMN avatar TEXT");
        } catch (e) {}

        // Tabla de pilotos
        db.exec(`
            CREATE TABLE IF NOT EXISTS pilotos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                apellido TEXT,
                telefono TEXT NOT NULL,
                licencia TEXT UNIQUE NOT NULL,
                placa TEXT UNIQUE NOT NULL,
                modelo TEXT,
                color TEXT,
                foto TEXT,
                foto_vehiculo TEXT,
                estado TEXT DEFAULT 'disponible',
                latitud REAL,
                longitud REAL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Agregar campos faltantes si no existen
        try {
            db.exec("ALTER TABLE pilotos ADD COLUMN foto TEXT");
        } catch (e) {}
        try {
            db.exec("ALTER TABLE pilotos ADD COLUMN foto_vehiculo TEXT");
        } catch (e) {}
        try {
            db.exec("ALTER TABLE pilotos ADD COLUMN apellido TEXT");
        } catch (e) {}

        // Tabla de pasajeros
        db.exec(`
            CREATE TABLE IF NOT EXISTS pasajeros (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                telefono TEXT NOT NULL,
                email TEXT,
                direccion TEXT,
                avatar TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Agregar columna avatar si no existe (migración)
        try {
            db.exec("ALTER TABLE pasajeros ADD COLUMN avatar TEXT");
        } catch (e) {}

        // Tabla de viajes
        db.exec(`
            CREATE TABLE IF NOT EXISTS viajes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                pasajero_id INTEGER,
                piloto_id INTEGER,
                origen_direccion TEXT NOT NULL,
                origen_lat REAL NOT NULL,
                origen_lng REAL NOT NULL,
                destino_direccion TEXT NOT NULL,
                destino_lat REAL NOT NULL,
                destino_lng REAL NOT NULL,
                distancia REAL,
                duracion_estimada INTEGER,
                precio REAL,
                precio_aceptado REAL,
                estado TEXT DEFAULT 'buscando',
                fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
                fecha_inicio DATETIME,
                fecha_fin DATETIME,
                FOREIGN KEY (pasajero_id) REFERENCES pasajeros(id),
                FOREIGN KEY (piloto_id) REFERENCES pilotos(id)
            )
        `);
        
        // Agregar campos faltantes para migración
        try { db.exec("ALTER TABLE viajes ADD COLUMN duracion_estimada INTEGER"); } catch (e) {}
        try { db.exec("ALTER TABLE viajes ADD COLUMN precio_aceptado REAL"); } catch (e) {}
        try { db.exec("ALTER TABLE viajes ADD COLUMN metodo_pago TEXT DEFAULT 'efectivo'"); } catch (e) {}
        try { db.exec("ALTER TABLE viajes ADD COLUMN estado TEXT DEFAULT 'buscando'"); } catch (e) {}

        // Tabla de reseñas
        db.exec(`
            CREATE TABLE IF NOT EXISTS resenas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                viaje_id INTEGER NOT NULL,
                pasajero_id INTEGER NOT NULL,
                piloto_id INTEGER NOT NULL,
                calificacion INTEGER NOT NULL CHECK(calificacion >= 1 AND calificacion <= 5),
                comentario TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (viaje_id) REFERENCES viajes(id),
                FOREIGN KEY (pasajero_id) REFERENCES pasajeros(id),
                FOREIGN KEY (piloto_id) REFERENCES pilotos(id)
            )
        `);

        // Tabla de configuración del sistema
        db.exec(`
            CREATE TABLE IF NOT EXISTS config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clave TEXT UNIQUE NOT NULL,
                valor TEXT,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Tabla de plantillas de notificaciones
        db.exec(`
            CREATE TABLE IF NOT EXISTS plantillas_notificaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clave TEXT UNIQUE NOT NULL,
                titulo TEXT NOT NULL,
                mensaje TEXT NOT NULL,
                activo INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insertar plantillas por defecto si no existen
        const plantillasCount = db.prepare('SELECT COUNT(*) as count FROM plantillas_notificaciones').get();
        if (plantillasCount.count === 0) {
            const insertPlantilla = db.prepare(`
                INSERT INTO plantillas_notificaciones (clave, titulo, mensaje, activo)
                VALUES (?, ?, ?, ?)
            `);
            
            insertPlantilla.run(
                'pin_verificacion',
                '🔐 Verificación MotoTaxi',
                'Tu código de verificación para MotoTaxi es: *{pin}*\n\nEste código expira en {minutos} minutos.',
                1
            );
            
            insertPlantilla.run(
                'nuevo_viaje',
                '🚗 Nueva Solicitud de Viaje',
                '📍 *Origen:* {origen}\n🏁 *Destino:* {destino}\n📏 *Distancia:* {distancia} km\n⏱️ *Tiempo:* {tiempo} min\n💰 *Precio:* {precio} {moneda}',
                1
            );
            
            insertPlantilla.run(
                'viaje_aceptado',
                '✅ Viaje Aceptado',
                '✅ *{piloto}* aceptó tu solicitud!\n\n🏍️ *Mototaxi:* {placa}\n💰 *Precio acordado:* {precio} {moneda}\n\nConfirma el viaje en la app para continuar.',
                1
            );
            
            insertPlantilla.run(
                'viaje_iniciado',
                '🚗 Viaje Iniciado',
                'El chofer está en camino a recogerte.\n\n¡Prepárate!',
                1
            );
            
            insertPlantilla.run(
                'viaje_completado',
                '✅ Viaje Completado',
                '¡Gracias por usar MotoTaxi!\n\n💰 *Monto:* {precio} {moneda}\n\nTu calificación ayuda a mejorar el servicio.',
                1
            );
            
            insertPlantilla.run(
                'sin_choferes',
                '🚗 Solicitud de Viaje',
                'Lo sentimos, no hay choferes disponibles en este momento.\n\nTe notificaremos cuando algún chofer acepte tu solicitud.\n\n📍 *Origen:* {origen}\n🏁 *Destino:* {destino}',
                1
            );
        }

        // Insertar usuario admin por defecto si no existe
        const adminExists = db.prepare('SELECT COUNT(*) as count FROM usuarios WHERE username = ?').get('admin');
        if (adminExists.count === 0) {
            db.prepare(`
                INSERT INTO usuarios (username, password, nombre, email, rol)
                VALUES (?, ?, ?, ?, ?)
            `).run('admin', 'admin123', 'Administrador', 'admin@mototaxi.com', 'administrador');
        }

       
     

        console.log('✅ Base de datos inicializada correctamente');
    } catch (error) {
        console.error('❌ Error al inicializar la base de datos:', error);
        throw error;
    }
}

// Ejecutar inicialización si se llama directamente
initializeDatabase();
