const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Credenziali GloriaFood
const GLORIAFOOD_CONFIG = {
    referenceToken: 'dRsF6MNHZL7FSZfcSusSAn5bffSKCYnMs',
    localKey: 'B9pGot0GJtw5rrEy3x',
    serverKey: 'ELfQ7Tl4uJf6deGY3AekkDg81mRIEoJi0',
    email: 'info.fantasygadgets@gmail.com'
};

// Middleware
app.use(cors());
app.use(express.json());

// Array per salvare ordini (temporaneo)
let ordini = [];

// Funzione per validare webhook GloriaFood
function validateGloriaFoodWebhook(data) {
    if (!data.local_key || !data.server_key) {
        return false;
    }
    
    return data.local_key === GLORIAFOOD_CONFIG.localKey && 
           data.server_key === GLORIAFOOD_CONFIG.serverKey;
}

// Endpoint webhook per GloriaFood
app.post('/webhook/gloriafood', (req, res) => {
    console.log('Webhook ricevuto:', req.headers);
    console.log('Dati ricevuti:', req.body);
    
    // Valida le credenziali
    if (!validateGloriaFoodWebhook(req.body)) {
        console.log('Autenticazione fallita');
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Processa l'ordine
    const ordine = {
        id: Date.now(),
        cliente: req.body.client?.name || 'Cliente sconosciuto',
        telefono: req.body.client?.phone || '',
        indirizzo: req.body.client?.address || '',
        totale: req.body.order_total || '0.00',
        stato: 'ricevuto',
        fonte: 'gloriafood',
        timestamp: new Date().toISOString(),
        datiCompleti: req.body
    };
    
    ordini.unshift(ordine);
    console.log('Ordine salvato:', ordine.id);
    
    // Risposta di successo per GloriaFood
    res.status(200).json({ 
        success: true,
        message: 'Order received successfully' 
    });
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
    `);
});

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
