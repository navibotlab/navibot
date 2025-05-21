const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

// Ruta para servir la documentación HTML
router.get('/', (req, res) => {
  const docPath = path.join(__dirname, 'index.html');
  
  fs.readFile(docPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer el archivo de documentación:', err);
      return res.status(500).send('Error al cargar la documentación');
    }
    
    res.send(data);
  });
});

// Ruta para servir recursos estáticos (CSS, imágenes, etc.)
router.use('/assets', express.static(path.join(__dirname, 'assets')));

module.exports = router; 