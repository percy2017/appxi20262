import express from 'express';

const router = express.Router();

/**
 * GET home page - Landing Page
 * Renderiza la página principal del sistema de mototaxi
 */
router.get('/', function(req, res, next) {
  res.render('index', { 
    title: 'MotoTaxi - Transporte Rápido y Seguro',
    description: 'Solicita un mototaxi con solo unos clics. Rápido, seguro y confiable.'
  });
});

export default router;
