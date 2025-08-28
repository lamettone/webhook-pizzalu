const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Credenziali GloriaFood aggiornate
const GLORIAFOOD_CONFIG = {
    referenceToken: 'dRsFeMNHZL7FSZfcSusSAn5bffSKCYnMs',
    localKey: 'B9pGqO0Qhvv5rEy3x',
    serverKey: 'ELQTTkujf6deGY3AekkDg81mRIEoJi0',
    email: 'info.fantasygadgets@gmail.com'
};

// Middleware
app.use(cors());
app.use(express.json());

// Array per salvare ordini (temporaneo)
let ordini = [];

// Funzione per validare webhook GloriaFood
function validateGloriaFoodWebhook(data) {
    console.log('Validazione webhook:');
    console.log('Local key ricevuta:', data.local_key);
    console.log('Local key attesa:', GLORIAFOOD_CONFIG.localKey);
    console.log('Server key ricevuta:', data.server_key);
    console.log('Server key attesa:', GLORIAFOOD_CONFIG.serverKey);
    
    if (!data.local_key || !data.server_key) {
        console.log('Chiavi mancanti');
        return false;
    }
    
    const isValid = data.local_key === GLORIAFOOD_CONFIG.localKey && 
                   data.server_key === GLORIAFOOD_CONFIG.serverKey;
    
    console.log('Validazione risultato:', isValid);
    return isValid;
}

// Endpoint webhook per GloriaFood
app.post('/webhook/gloriafood', (req, res) => {
    console.log('=== WEBHOOK RICEVUTO ===');
    console.log('Headers:', req.headers);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    
    // Valida le credenziali
    if (!validateGloriaFoodWebhook(req.body)) {
        console.log('ERRORE: Autenticazione fallita');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    console.log('Autenticazione OK - Processando ordine...');
    
    // Processa l'ordine
    const ordine = {
        id: Date.now(),
        cliente: req.body.client?.name || req.body.customer?.name || 'Cliente sconosciuto',
        telefono: req.body.client?.phone || req.body.customer?.phone || '',
        indirizzo: req.body.client?.address || req.body.customer?.address || '',
        totale: req.body.order_total || req.body.total || '0.00',
        stato: 'ricevuto',
        fonte: 'gloriafood',
        timestamp: new Date().toISOString(),
        datiCompleti: req.body
    };
    
    ordini.unshift(ordine);
    console.log('Ordine salvato con ID:', ordine.id);
    console.log('Totale ordini:', ordini.length);
    
    // Risposta di successo per GloriaFood
    res.status(200).json({ 
        success: true,
        message: 'Order received successfully',
        order_id: ordine.id
    });
});

// Endpoint per ottenere ordini
app.get('/api/ordini', (req, res) => {
    res.json(ordini);
});

// Homepage con più dettagli
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
    console.log('Configurazione GloriaFood:');
    console.log('- Local Key:', GLORIAFOOD_CONFIG.localKey);
    console.log('- Server Key:', GLORIAFOOD_CONFIG.serverKey);
});
