const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const app = express();
const PORT = process.env.PORT || 3000;

// Credenziali GloriaFood
const GLORIAFOOD_CONFIG = {
    referenceToken: 'tBeZlepAJq28Ratz5OjJucLMxS2YTsNNN',
    localKey: 'B9pGot0GJtw5rrEy3x',
    serverKey: 'sgOJB7BFApBvXeBJ3T1X2BljY3lK4zZRB',
    email: 'info.fantasygadgets@gmail.com'
};

// Connessione PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Crea tabelle se non esistono
async function initDatabase() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ordini (
                id SERIAL PRIMARY KEY,
                gloriafood_id VARCHAR(50),
                cliente VARCHAR(255),
                telefono VARCHAR(50),
                indirizzo TEXT,
                totale DECIMAL(10,2),
                stato VARCHAR(50) DEFAULT 'ricevuto',
                fonte VARCHAR(50) DEFAULT 'gloriafood',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                dati_completi JSONB
            )
        `);
        console.log('Database inizializzato correttamente');
    } catch (error) {
        console.error('Errore inizializzazione database:', error);
    }
}

// Endpoint webhook per GloriaFood
app.post('/webhook/gloriafood', async (req, res) => {
    try {
        console.log('=== WEBHOOK RICEVUTO ===');
        
        // Estrai dati ordine
        let orderData = req.body;
        if (req.body.orders && req.body.orders.length > 0) {
            orderData = req.body.orders[0];
        }
        
        const cliente = orderData.client?.name || 
                        orderData.customer?.name || 
                        'Cliente GloriaFood';
        
        const telefono = orderData.client?.phone || 
                        orderData.customer?.phone || '';
        
        // Salva nel database
        const result = await pool.query(
            `INSERT INTO ordini (gloriafood_id, cliente, telefono, indirizzo, totale, dati_completi) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [
                orderData.id || null,
                cliente.trim(),
                telefono,
                orderData.client?.address || orderData.customer?.address || '',
                orderData.total || orderData.order_total || '0.00',
                JSON.stringify(req.body)
            ]
        );
        
        console.log('Ordine salvato nel database con ID:', result.rows[0].id);
        console.log('Cliente:', cliente);
        
        res.status(200).json({ 
            success: true,
            message: 'Order received successfully',
            order_id: result.rows[0].id
        });
        
    } catch (error) {
        console.error('ERRORE nel processing webhook:', error);
        res.status(200).json({ 
            success: true,
            message: 'Order received but processing failed',
            error: error.message
        });
    }
});

// API per ottenere ordini
app.get('/api/ordini', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM ordini ORDER BY created_at DESC LIMIT 100'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Errore nel recuperare ordini:', error);
        res.status(500).json({ error: 'Errore server' });
    }
});

// Homepage
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT COUNT(*) FROM ordini');
        const count = result.rows[0].count;
        
        res.send(`
            <h1>Webhook GloriaFood Attivo</h1>
            <p>Server funzionante con PostgreSQL!</p>
            <p>Ordini totali nel database: ${count}</p>
            <p>Endpoint: /webhook/gloriafood</p>
            <hr>
            <p><a href="/api/ordini">Visualizza ordini JSON</a></p>
        `);
    } catch (error) {
        res.send(`
            <h1>Webhook GloriaFood</h1>
            <p>Server attivo ma errore database: ${error.message}</p>
        `);
    }
});

// Avvia server e inizializza database
app.listen(PORT, async () => {
    console.log(`Server avviato sulla porta ${PORT}`);
    await initDatabase();
});
