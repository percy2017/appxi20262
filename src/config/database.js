/**
 * Configuración de Base de Datos SQLite
 * Maneja la conexión a la base de datos SQLite usando better-sqlite3
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta de la base de datos en la raíz del proyecto
const dbPath = path.join(__dirname, '../../database/mototaxi.db');

// Crear conexión a la base de datos
const db = new Database(dbPath);

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Exportar instancia de base de datos
export default db;

/**
 * Función para obtener la instancia de la base de datos
 * @returns {Database} Instancia de la base de datos
 */
export function getDatabase() {
    return db;
}
