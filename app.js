import createError from 'http-errors';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import logger from 'morgan';
import cors from 'cors';

import indexRouter from './routes/index.js';
import adminRouter from './routes/admin.js';
import evolutionRouter from './routes/evolution.js';
import apiRouter from './routes/api.js';
// import usersRouter from './routes/users.js';

// Importar e inicializar la base de datos
import { initializeDatabase } from './src/database/init.js';

// Inicializar la base de datos al iniciar la aplicación
initializeDatabase();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuración de CORS para permitir conexiones desde cualquier origen
app.use(cors({
    origin: true,
    credentials: true
}));

// Hacer variables de entorno disponibles en las vistas
app.locals.MONEDA = process.env.MONEDA || 'Bs';
app.locals.PRECIO_BASE = process.env.PRECIO_BASE || '5';
app.locals.PRECIO_KM = process.env.PRECIO_KM || '3';

// Configuración de sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'mototaxi_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        httpOnly: true
    }
}));

// Middleware para hacer la sesión disponible en las vistas
app.use((req, res, next) => {
    res.locals.session = req.session;
    res.locals.usuario = req.session.usuario || null;
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Helper para usar layouts en EJS
app.use(function(req, res, next) {
    res.renderWithLayout = function(view, options = {}) {
        const defaultOptions = {
            ...options,
            currentPage: options.currentPage || 'dashboard'
        };
        
        // Renderizar la vista primero
        res.render(view, defaultOptions, function(err, html) {
            if (err) {
                console.error('Error rendering view:', err);
                return res.status(500).send('Error rendering view');
            }
            
            // Renderizar con el layout
            res.render('layouts/admin-layout', {
                ...defaultOptions,
                body: html
            }, function(err, layoutHtml) {
                if (err) {
                    console.error('Error rendering layout:', err);
                    return res.send(html); // Enviar solo la vista si el layout falla
                }
                res.send(layoutHtml);
            });
        });
    };
    next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/admin', adminRouter);
app.use('/', evolutionRouter);
app.use('/', apiRouter);  // Rutas públicas de API para WebApps
// app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

export default app;
