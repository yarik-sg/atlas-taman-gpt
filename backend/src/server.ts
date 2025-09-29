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
  res.json({ status: 'OK', message: 'Atlas Taman GPT API 🚀' });
});

app.get('/api/search', (req, res) => {
  const { q, sortBy = 'relevance' } = req.query;
  let results = [...mockProducts];
  
  if (q) {
    const query = (q as string).toLowerCase();
    results = results.filter(p => 
      p.name.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query)
    );
  }
  
  if (sortBy === 'price_asc') results.sort((a, b) => a.minPrice - b.minPrice);
  if (sortBy === 'price_desc') results.sort((a, b) => b.minPrice - a.minPrice);
  if (sortBy === 'name') results.sort((a, b) => a.name.localeCompare(b.name));
  
  res.json({
    success: true,
    data: { results, pagination: { total: results.length } }
  });
});

app.get('/api/products', (req, res) => {
  res.json({ success: true, data: { products: mockProducts } });
});

app.listen(PORT, () => {
  console.log(`🚀 API Atlas Taman GPT sur le port ${PORT}`);
  console.log(`🔍 Search: http://localhost:${PORT}/api/search?q=iphone`);
});
