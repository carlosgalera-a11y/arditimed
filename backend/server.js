/* ═══════════════════════════════════════
   API PROXY — Área II Cartagena
   Oculta las API keys del frontend
   Deploy: Docker en UGREEN NAS
   ═══════════════════════════════════════ */
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3100;

// Keys (solo en el servidor, nunca en el frontend)
const OR_KEY = process.env.OPENROUTER_KEY || '';
const DEEPL_KEY = process.env.DEEPL_KEY || '';

// CORS: solo permitir la webapp
app.use(cors({
  origin: [
    'https://carlosgalera-a11y.github.io',
    'https://ramongalera22-ai.github.io',
    'http://localhost:3000',
    'http://localhost:8080'
  ]
}));
app.use(express.json({ limit: '5mb' }));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Proxy OpenRouter
app.post('/api/openrouter', async (req, res) => {
  if (!OR_KEY) return res.status(500).json({ error: 'OPENROUTER_KEY not configured' });
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + OR_KEY,
        'HTTP-Referer': 'https://carlosgalera-a11y.github.io/Cartagenaeste/',
        'X-Title': 'Area II Cartagena'
      },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Proxy DeepL
app.post('/api/deepl', async (req, res) => {
  if (!DEEPL_KEY) return res.status(500).json({ error: 'DEEPL_KEY not configured' });
  try {
    const r = await fetch('https://api-free.deepl.com/v2/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'DeepL-Auth-Key ' + DEEPL_KEY },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, '0.0.0.0', () => console.log(`[API Proxy] Running on port ${PORT}`));
