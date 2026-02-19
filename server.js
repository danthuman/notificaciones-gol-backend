const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Mapeo de países a inglés
const countryMapping = {
  'México': 'mexico',
  'Estados Unidos': 'united-states',
  'Canadá': 'canada',
  'Argentina': 'argentina',
  'Brasil': 'brazil',
  'Francia': 'france',
  'Colombia': 'colombia',
  'Inglaterra': 'england',
  'Países Bajos': 'netherlands',
  'Suecia': 'sweden'
};

// Endpoint para guardar preferencias
app.post('/api/save-preferences/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { teams } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'Se requiere userId' });
    }

    console.log(`Usuario: ${userId}, Equipos:`, teams);

    // Aquí irá la integración con Braze
    // Por ahora solo simulamos éxito
    
    res.json({
      success: true,
      message: 'Preferencias recibidas (modo demo)',
      userId,
      teams
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
