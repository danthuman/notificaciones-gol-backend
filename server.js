const express = require('express');
const axios = require('axios');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Configuración de seguridad
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
}));

// CORS
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Configuración Braze (usando variables de entorno)
const BRAZE_API_KEY = process.env.BRAZE_API_KEY || '4d028eac-8cfd-4fef-94b1-229cf3e84d0c';
const BRAZE_INSTANCE_URL = process.env.BRAZE_INSTANCE_URL || 'https://rest.iad-05.braze.com';

// Mapeo de países a inglés (formato Braze)
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
    // Headers CORS
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    const startTime = Date.now();
    
    try {
        const { userId } = req.params;
        const { teams } = req.body;

        console.log('📥 Petición recibida:', { userId, teams });

        // Validaciones
        if (!userId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Se requiere userId' 
            });
        }

        if (!teams || !Array.isArray(teams)) {
            return res.status(400).json({ 
                success: false, 
                error: 'El campo "teams" debe ser un array' 
            });
        }

        // Construir payload para Braze
        // crm_test_wc26_goal: true si hay equipos seleccionados, false si no
        // crm_test_wc26_goal_team: array con los equipos seleccionados
        const brazePayload = {
            attributes: [
                {
                    external_id: userId,
                    crm_test_wc26_goal: teams.length > 0,
                    crm_test_wc26_goal_team: teams  // Array directamente (reemplaza completamente)
                }
            ]
        };

        console.log('📤 Enviando a Braze:', JSON.stringify(brazePayload, null, 2));

        // Llamada a Braze API
        const brazeResponse = await axios.post(
            `${BRAZE_INSTANCE_URL}/users/track`,
            brazePayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${BRAZE_API_KEY}`
                }
            }
        );

        console.log('📬 Respuesta de Braze:', brazeResponse.data);

        // Verificar respuesta de Braze
        if (brazeResponse.data.message === 'success') {
            const duration = Date.now() - startTime;
            
            console.log(`✅ Éxito - Usuario: ${userId}, Equipos: ${teams.length}, Duración: ${duration}ms`);
            
            return res.json({
                success: true,
                message: 'Preferencias guardadas correctamente en Braze',
                userId,
                teams,
                brazeResponse: brazeResponse.data,
                timestamp: new Date().toISOString()
            });
        } else {
            console.error('❌ Error de Braze:', brazeResponse.data);
            return res.status(500).json({
                success: false,
                error: 'Braze no procesó la solicitud correctamente',
                brazeResponse: brazeResponse.data
            });
        }

    } catch (error) {
        console.error('❌ Error en el endpoint:', error);
        
        const errorResponse = {
            success: false,
            error: 'Error interno del servidor',
            timestamp: new Date().toISOString()
        };

        if (error.response) {
            // Error de Braze API
            errorResponse.brazeError = {
                status: error.response.status,
                data: error.response.data
            };
            console.error('Error de Braze API:', error.response.status, error.response.data);
        } else if (error.request) {
            errorResponse.error = 'No se pudo conectar con Braze';
            console.error('No hubo respuesta de Braze');
        } else {
            errorResponse.error = error.message;
        }

        return res.status(500).json(errorResponse);
    }
});

// Manejar preflight requests
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
        braze_configured: true,
        braze_instance: BRAZE_INSTANCE_URL
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: 'API de Notificaciones de Gol',
        endpoints: {
            health: '/health',
            savePreferences: '/api/save-preferences/:userId (POST)'
        },
        braze_status: 'conectado'
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`🔌 Conectado a Braze: ${BRAZE_INSTANCE_URL}`);
});
