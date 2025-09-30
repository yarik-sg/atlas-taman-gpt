import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { productAggregator, AggregatedProduct } from './services/productAggregator';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const sortProducts = (products: AggregatedProduct[], sortBy: string) => {
  const sorted = [...products];
  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => (a.minTotalPrice || a.minPrice) - (b.minTotalPrice || b.minPrice));
    case 'price_desc':
      return sorted.sort((a, b) => (b.minTotalPrice || b.minPrice) - (a.minTotalPrice || a.minPrice));
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return sorted;
  }
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', message: 'Atlas Taman GPT API 🚀' });
});

app.get('/api/search', async (req, res) => {
  try {
    const { q = '', sortBy = 'relevance' } = req.query;
    const query = typeof q === 'string' ? q : '';
    const sortParam = typeof sortBy === 'string' ? sortBy : 'relevance';

    const { products, errors, metadata } = await productAggregator.search(query);
    const sortedProducts = sortProducts(products, sortParam);

    res.json({
      success: true,
      data: {
        results: sortedProducts,
        pagination: { total: sortedProducts.length },
        errors,
        metadata,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de produits', error);
    res.status(500).json({ success: false, error: 'Une erreur est survenue lors de la recherche.' });
  }
});

app.get('/api/products', async (_req, res) => {
  try {
    const { products, errors, metadata } = await productAggregator.listProducts();
    res.json({ success: true, data: { products, errors, metadata } });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits', error);
    res.status(500).json({ success: false, error: 'Impossible de charger les produits.' });
  }
});

let server: ReturnType<typeof app.listen> | undefined;

if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 API Atlas Taman GPT sur le port ${PORT}`);
    console.log(`🔍 Search: http://localhost:${PORT}/api/search?q=iphone`);
  });
}

export { app, server };
