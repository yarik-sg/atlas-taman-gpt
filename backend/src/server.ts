import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Prisma, PrismaClient } from '@prisma/client';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: { offers: { include: { merchant: true } } };
}>;

const formatProductResponse = (product: ProductWithRelations) => {
  const offers = product.offers.map((offer) => {
    const totalPrice = offer.price + (offer.shippingFee ?? 0);

    return {
      id: offer.id,
      price: offer.price,
      totalPrice,
      currency: offer.currency,
      shippingFee: offer.shippingFee,
      isAvailable: offer.isAvailable,
      url: offer.url,
      merchant: {
        id: offer.merchant.id,
        name: offer.merchant.name,
        url: offer.merchant.url,
        logoUrl: offer.merchant.logoUrl,
        city: offer.merchant.city,
      },
      createdAt: offer.createdAt.toISOString(),
      updatedAt: offer.updatedAt.toISOString(),
    };
  });

  const offerTotals = offers.map((offer) => offer.totalPrice);
  const minPrice = offers.length ? Math.min(...offers.map((offer) => offer.price)) : 0;
  const maxPrice = offers.length ? Math.max(...offers.map((offer) => offer.price)) : 0;
  const minTotalPrice = offerTotals.length ? Math.min(...offerTotals) : 0;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    brand: product.brand,
    model: product.model,
    category: product.category,
    categorySlug: product.categorySlug,
    images: product.images,
    minPrice,
    maxPrice,
    minTotalPrice,
    offersCount: offers.length,
    specifications: product.specifications,
    createdAt: product.createdAt.toISOString(),
    offers,
  };
};

const loadProducts = async (where?: Prisma.ProductWhereInput) => {
  const products = await prisma.product.findMany({
    where,
    include: {
      offers: {
        include: {
          merchant: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return products.map(formatProductResponse);
};

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Atlas Taman GPT API 🚀' });
});

app.get('/api/search', async (req, res) => {
  try {
    const { q, sortBy = 'relevance' } = req.query;
    const searchTerm = typeof q === 'string' ? q.trim() : '';

    const where: Prisma.ProductWhereInput | undefined = searchTerm
      ? {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { brand: { contains: searchTerm, mode: 'insensitive' } },
            { category: { contains: searchTerm, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const products = await loadProducts(where);

    const sortedProducts = [...products];

    if (sortBy === 'price_asc') {
      sortedProducts.sort((a, b) => (a.minTotalPrice ?? a.minPrice) - (b.minTotalPrice ?? b.minPrice));
    } else if (sortBy === 'price_desc') {
      sortedProducts.sort((a, b) => (b.minTotalPrice ?? b.minPrice) - (a.minTotalPrice ?? a.minPrice));
    } else if (sortBy === 'name') {
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    }

    res.json({
      success: true,
      data: { results: sortedProducts, pagination: { total: sortedProducts.length } },
    });
  } catch (error) {
    console.error('Erreur lors de la recherche de produits', error);
    res.status(500).json({ success: false, error: 'Une erreur est survenue lors de la recherche.' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await loadProducts();

    res.json({ success: true, data: { products } });
  } catch (error) {
    console.error('Erreur lors de la récupération des produits', error);
    res.status(500).json({ success: false, error: 'Impossible de charger les produits.' });
  }
});

const server = app.listen(PORT, () => {
  console.log(`🚀 API Atlas Taman GPT sur le port ${PORT}`);
  console.log(`🔍 Search: http://localhost:${PORT}/api/search?q=iphone`);
});

const shutdown = async () => {
  console.log('👋 Arrêt du serveur, fermeture de la connexion Prisma...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
