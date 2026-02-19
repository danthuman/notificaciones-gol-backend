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

        // Construir payload para Braze
        let brazeAttributes = {
            external_id: userId
        };

        // Si teams es null, significa que debemos eliminar los atributos
        if (teams === null) {
            brazeAttributes.crm_test_wc26_goal = null;
            brazeAttributes.crm_test_wc26_goal_team = null;
            console.log('🗑️ Eliminando atributos para usuario:', userId);
        } 
        // Si es array (vacío o con valores)
        else if (Array.isArray(teams)) {
            brazeAttributes.crm_test_wc26_goal = teams.length > 0;
            brazeAttributes.crm_test_wc26_goal_team = teams;
            console.log(`📝 Guardando ${teams.length} equipos para usuario:`, userId);
        }
        // Si no es null ni array, error
        else {
            return res.status(400).json({
                success: false,
                error: 'El campo "teams" debe ser un array o null'
            });
        }

        const brazePayload = {
            attributes: [brazeAttributes]
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
            
            console.log(`✅ Éxito - Usuario: ${userId}, Duración: ${duration}ms`);
            
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
        // ... resto del manejo de errores
    }
});
