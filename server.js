const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Array per salvare ordini (temporaneo)
let ordini = [];

// Endpoint webhook per GloriaFood
app.post('/webhook/gloriafood', (req, res) => {
    console.log('Ordine ricevuto da GloriaFood:', req.body);
    
    // Salva l'ordine
    const ordine = {
        id: Date.now(),
        datiGloriaFood: req.body,
        timestamp: new Date().toISOString()
    };
    
    ordini.unshift(ordine);
    
    // Risposta a GloriaFood
    res.status(200).json({ success: true });
});

// Endpoint per ottenere ordini
app.get('/api/ordini', (req, res) => {
    res.json(ordini);
});

// Homepage
app.get('/', (req, res) => {
    res.send('<h1>Webhook GloriaFood Attivo</h1><p>Server funzionante!</p>');
});

app.listen(PORT, () => {
    console.log(`Server avviato sulla porta ${PORT}`);
});
