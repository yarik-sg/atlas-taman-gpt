import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with merchants, products and offers...');

  await prisma.offer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.merchant.deleteMany();

  const merchants = await Promise.all([
    prisma.merchant.create({
      data: {
        name: 'Electro Planet',
        city: 'Casablanca',
        url: 'https://www.electroplanet.ma',
        logoUrl: 'https://via.placeholder.com/120x120/2563eb/ffffff?text=EP'
      }
    }),
    prisma.merchant.create({
      data: {
        name: 'Microchoix',
        city: 'Rabat',
        url: 'https://www.microchoix.ma',
        logoUrl: 'https://via.placeholder.com/120x120/16a34a/ffffff?text=MC'
      }
    }),
    prisma.merchant.create({
      data: {
        name: 'Jumia Maroc',
        city: 'Casablanca',
        url: 'https://www.jumia.ma',
        logoUrl: 'https://via.placeholder.com/120x120/f97316/ffffff?text=JM'
      }
    })
  ]);

  await prisma.product.create({
    data: {
      name: 'iPhone 15 Pro 128GB',
      slug: 'iphone-15-pro-128gb',
      brand: 'Apple',
      category: 'Smartphones',
      categorySlug: 'smartphones',
      model: 'A3103',
      images: ['https://via.placeholder.com/300x300/0ea5e9/ffffff?text=iPhone+15+Pro'],
      specifications: {
        screen: '6.1 pouces',
        ram: '8 GB',
        storage: '128 GB',
        chipset: 'Apple A17 Pro'
      },
      offers: {
        create: [
          {
            price: 12999,
            shippingFee: 49,
            merchant: { connect: { id: merchants[0].id } },
            url: 'https://www.electroplanet.ma/iphone-15-pro'
          },
          {
            price: 13299,
            shippingFee: 0,
            merchant: { connect: { id: merchants[1].id } },
            url: 'https://www.microchoix.ma/iphone-15-pro-128gb'
          },
          {
            price: 13599,
            shippingFee: 0,
            merchant: { connect: { id: merchants[2].id } },
            url: 'https://www.jumia.ma/iphone-15-pro-128gb'
          }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'Samsung Galaxy S24 Ultra 256GB',
      slug: 'samsung-galaxy-s24-ultra',
      brand: 'Samsung',
      category: 'Smartphones',
      categorySlug: 'smartphones',
      model: 'SM-S928B',
      images: ['https://via.placeholder.com/300x300/6366f1/ffffff?text=Galaxy+S24'],
      specifications: {
        screen: '6.8 pouces',
        ram: '12 GB',
        storage: '256 GB',
        chipset: 'Snapdragon 8 Gen 3'
      },
      offers: {
        create: [
          {
            price: 15299,
            shippingFee: 99,
            merchant: { connect: { id: merchants[0].id } },
            url: 'https://www.electroplanet.ma/galaxy-s24-ultra'
          },
          {
            price: 15599,
            shippingFee: 49,
            merchant: { connect: { id: merchants[1].id } },
            url: 'https://www.microchoix.ma/samsung-galaxy-s24-ultra-256gb'
          },
          {
            price: 15499,
            shippingFee: 0,
            merchant: { connect: { id: merchants[2].id } },
            url: 'https://www.jumia.ma/samsung-galaxy-s24-ultra-256gb'
          }
        ]
      }
    }
  });

  await prisma.product.create({
    data: {
      name: 'PlayStation 5 Slim',
      slug: 'playstation-5-slim',
      brand: 'Sony',
      category: 'Gaming',
      categorySlug: 'gaming',
      images: ['https://via.placeholder.com/300x300/8b5cf6/ffffff?text=PS5+Slim'],
      specifications: {
        storage: '1 TB',
        resolution: '4K',
        bundle: 'Manette DualSense incluse'
      },
      offers: {
        create: [
          {
            price: 5499,
            shippingFee: 0,
            merchant: { connect: { id: merchants[0].id } },
            url: 'https://www.electroplanet.ma/ps5-slim'
          },
          {
            price: 5590,
            shippingFee: 79,
            merchant: { connect: { id: merchants[1].id } },
            url: 'https://www.microchoix.ma/playstation-5-slim'
          },
          {
            price: 5699,
            shippingFee: 0,
            merchant: { connect: { id: merchants[2].id } },
            url: 'https://www.jumia.ma/playstation-5-slim'
          }
        ]
      }
    }
  });

  console.log('✅ Seed completed.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

