const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Credenziali GloriaFood aggiornate
const GLORIAFOOD_CONFIG = {
    referenceToken: 'tBeZlepAJq28Ratz5OjJucLMxS2YTsNNN',
    localKey: 'B9pGot0GJtw5rrEy3x',
    serverKey: 'sgOJB7BFApBvXeBJ3T1X2BljY3lK4zZRB',
    email: 'info.fantasygadgets@gmail.com'
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Aumenta il limite per payload grandi

// Array per salvare ordini (temporaneo)
let ordini = [];

// Funzione per validare webhook GloriaFood
function validateGloriaFoodWebhook(data) {
    // GloriaFood sembra usare l'authorization header invece dei campi nel body
    return true; // Per ora saltiamo la validazione per debug
}

// Endpoint webhook per GloriaFood
app.post('/webhook/gloriafood', (req, res) => {
    try {
        console.log('=== WEBHOOK RICEVUTO ===');
        console.log('Headers authorization:', req.headers.authorization);
        console.log('Body keys:', Object.keys(req.body));
        
        // Estrai il primo ordine se c'è un array
        let orderData = req.body;
        if (req.body.orders && req.body.orders.length > 0) {
            orderData = req.body.orders[0];
            console.log('Trovato ordine nell array, keys:', Object.keys(orderData));
        }
        
        // Estrai dati cliente
        const cliente = orderData.client?.name || 
                        orderData.customer?.name || 
                        orderData.billing_details?.first_name + ' ' + orderData.billing_details?.last_name || 
                        'Cliente GloriaFood';
        
        const telefono = orderData.client?.phone || 
                        orderData.customer?.phone || 
                        orderData.billing_details?.phone || '';
        
        // Crea ordine semplificato
        const ordine = {
            id: Date.now(),
            gloriaFoodId: orderData.id || 'N/A',
            cliente: cliente.trim(),
            telefono: telefono,
            indirizzo: orderData.client?.address || orderData.customer?.address || '',
            totale: orderData.total || orderData.order_total || '0.00',
            stato: 'ricevuto',
            fonte: 'gloriafood',
            timestamp: new Date().toISOString(),
            ordineCompleto: req.body // Salva tutto per debug
        };
        
        ordini.unshift(ordine);
        console.log('SUCCESSO: Ordine salvato');
        console.log('Cliente:', ordine.cliente);
        console.log('Telefono:', ordine.telefono);
        console.log('Totale ordini ora:', ordini.length);
        
        // Risposta di successo
        res.status(200).json({ 
            success: true,
            message: 'Order received successfully',
            order_id: ordine.id
        });
        
    } catch (error) {
        console.error('ERRORE nel processing webhook:', error);
        console.error('Stack:', error.stack);
        
        // Comunque rispondi con successo per non far ripetere GloriaFood
        res.status(200).json({ 
            success: true,
            message: 'Order received but processing failed',
            error: error.message
        });
    }
});

// Endpoint per ottenere ordini
app.get('/api/ordini', (req, res) => {
    res.json(ordini);
});

// Homepage
app.get('/', (req, res) => {
    res.send(`
        <h1>Webhook GloriaFood Attivo</h1>
        <p>Server funzionante!</p>
        <p>Ordini ricevuti: ${ordini.length}</p>
        <p>Endpoint: /webhook/gloriafood</p>
        <p>Ultima configurazione: ${new Date().toLocaleString('it-IT')}</p>
        <hr>
        <p><a href="/api/ordini">Visualizza ordini JSON</a></p>
    `);
});

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
    console.log('Configurazione GloriaFood caricata');
});
