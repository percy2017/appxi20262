/**
 * Controlador de Autenticación
 * Maneja el login y logout del panel de administración
 */

import { verifyCredentials, getUsuarioByUsername } from '../models/usuarioModel.js';

/**
 * Muestra la página de login
 */
export function loginPage(req, res) {
    // Si ya está logueado, redirigir al dashboard
    if (req.session && req.session.usuario) {
        return res.redirect('/admin');
    }
    
    // Renderizar sin usar el layout del admin
    res.render('admin/login', {
        error: null,
        success: null,
        layout: false
    });
}

/**
 * Procesa el login del usuario
 */
export function login(req, res) {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.render('admin/login', {
            error: 'Por favor, completa todos los campos',
            success: null,
            layout: false
        });
    }
    
    try {
        // Verificar credenciales
        const usuario = verifyCredentials(username, password);
        
        if (usuario) {
            // Crear sesión
            req.session.usuario = {
                id: usuario.id,
                username: usuario.username,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            };
            
            // Guardar sesión antes de redirigir
            req.session.save((err) => {
                if (err) {
                    console.error('Error al guardar sesión:', err);
                    return res.render('admin/login', {
                        error: 'Error al iniciar sesión. Intenta de nuevo.',
                        success: null,
                        layout: false
                    });
                }
                console.log(`✅ Usuario ${usuario.username} ha iniciado sesión`);
                // Redirigir al dashboard
                res.redirect('/admin');
            });
        } else {
            // Credenciales incorrectas
            console.log(`❌ Intento de login fallido para usuario: ${username}`);
            res.render('admin/login', {
                error: 'Usuario o contraseña incorrectos',
                success: null,
                layout: false
            });
        }
    } catch (error) {
        console.error('Error en login:', error);
        res.render('admin/login', {
            error: 'Error al procesar la solicitud. Intenta de nuevo.',
            success: null,
            layout: false
        });
    }
}

/**
 * Cierra la sesión del usuario
 */
export function logout(req, res) {
    const username = req.session.usuario ? req.session.usuario.username : 'desconocido';
    
    // Destruir sesión
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
        }
        
        console.log(`✅ Usuario ${username} ha cerrado sesión`);
        res.redirect('/admin/login');
    });
}

/**
 * Middleware para verificar si el usuario está autenticado
 */
export function requireAuth(req, res, next) {
    if (req.session && req.session.usuario) {
        // Usuario autenticado, continuar
        return next();
    }
    
    // Usuario no autenticado, redirigir al login
    res.redirect('/admin/login');
}

/**
 * Verifica si el usuario actual es administrador
 */
export function requireAdmin(req, res, next) {
    if (req.session && req.session.usuario) {
        if (req.session.usuario.rol === 'administrador') {
            return next();
        }
    }
    
    // No es administrador
    res.status(403).render('error', {
        message: 'Acceso denegado. Se requiere permiso de administrador.',
        error: { status: 403 }
    });
}
