import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Atlas Taman GPT API is running! 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'Atlas Taman GPT API',
    description: 'Comparateur de prix intelligent pour le Maroc',
    version: '1.0.0',
    powered_by: 'ChatGPT',
    endpoints: {
      health: '/api/health',
      products: '/api/products (à venir)',
      search: '/api/search (à venir)',
      auth: '/api/auth (à venir)',
      alerts: '/api/alerts (à venir)'
    },
    merchants: [
      'Electroplanet',
      'Jumia', 
      'Marjane',
      'BIM',
      'Decathlon',
      'H&M'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: 'Consultez /api pour voir les endpoints disponibles'
  });
});

app.listen(PORT, () => {
  console.log('🚀 Atlas Taman GPT API démarré!');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Health: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Info: http://localhost:${PORT}/api`);
  console.log(`🤖 Powered by ChatGPT`);
});
