const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Configuración más permisiva de seguridad
app.use(helmet({
    contentSecurityPolicy: false,  // Desactivamos CSP para pruebas
    crossOriginEmbedderPolicy: false
}));

// CORS completamente abierto para desarrollo
app.use(cors({
    origin: '*',  // Permite cualquier origen
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path} - Origin: ${req.get('origin') || 'unknown'}`);
    next();
});

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
    // Headers CORS explícitos
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    try {
        const { userId } = req.params;
        const { teams } = req.body;

        console.log('📥 Petición recibida:', { userId, teams });

        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Se requiere userId' 
            });
        }

        // Validar que teams sea un array
        if (!teams || !Array.isArray(teams)) {
            return res.status(400).json({ 
                success: false, 
                error: 'El campo "teams" debe ser un array' 
            });
        }

        // Aquí irá la integración con Braze después
        console.log(`✅ Usuario ${userId} seleccionó:`, teams);
        
        res.json({
            success: true,
            message: 'Preferencias guardadas correctamente',
            userId,
            teams,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error interno del servidor' 
        });
    }
});

// Manejar preflight requests (OPTIONS)
app.options('/api/save-preferences/:userId', (req, res) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200);
});

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        cors: 'enabled'
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'API de Notificaciones de Gol',
        endpoints: {
            health: '/health',
            savePreferences: '/api/save-preferences/:userId (POST)'
        }
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🌐 CORS: Permitido para todos los orígenes`);
});
