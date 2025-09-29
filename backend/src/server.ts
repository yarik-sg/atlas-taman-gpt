import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { mockProducts } from './mockData';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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
      search: '/api/search?q=query',
      products: '/api/products',
      productById: '/api/products/:id',
      suggestions: '/api/search/suggestions?q=query'
    },
    merchants: ['Electroplanet', 'Jumia', 'Marjane', 'BIM', 'Decathlon', 'H&M']
  });
});

app.get('/api/search', (req, res) => {
  const { q, category, sortBy = 'relevance' } = req.query;
  
  let results = [...mockProducts];
  
  if (q) {
    const query = (q as string).toLowerCase();
    results = results.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.brand.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  }
  
  if (category) {
    results = results.filter(product => product.categorySlug === category);
  }
  
  switch (sortBy) {
    case 'price_asc':
      results.sort((a, b) => a.minPrice - b.minPrice);
      break;
    case 'price_desc':
      results.sort((a, b) => b.minPrice - a.minPrice);
      break;
    case 'name':
      results.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'newest':
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }
  
  res.json({
    success: true,
    data: {
      results,
      pagination: {
        page: 1,
        limit: 20,
        total: results.length,
        pages: Math.ceil(results.length / 20)
      },
      filters: { query: q, category, sortBy }
    },
    message: `${results.length} produits trouvés`
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    data: { products: mockProducts, total: mockProducts.length }
  });
});

app.get('/api/products/:id', (req, res) => {
  const productId = parseInt(req.params.id);
  const product = mockProducts.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({
      success: false,
      message: 'Produit non trouvé'
    });
  }
  
  res.json({ success: true, data: { product } });
});

app.get('/api/search/suggestions', (req, res) => {
  const { q } = req.query;
  
  if (!q || (q as string).length < 2) {
    return res.json({
      success: true,
      data: { suggestions: { products: [], brands: [], categories: [] } }
    });
  }
  
  const query = (q as string).toLowerCase();
  const matchingProducts =
