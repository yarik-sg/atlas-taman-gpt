import React from 'react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  showDiscount?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, showDiscount = false }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const discount =
    showDiscount && product.maxPrice > product.minPrice
      ? Math.round(((product.maxPrice - product.minPrice) / product.maxPrice) * 100)
      : 0;

  const bestOffer = product.offers.length
    ? product.offers.reduce((best, offer) => {
        const bestTotal = best ? best.totalPrice : Number.POSITIVE_INFINITY;
        return offer.totalPrice < bestTotal ? offer : best;
      }, product.offers[0])
    : undefined;

  const displayedOffers = product.offers.slice(0, 3);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group">
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-4xl">📦</span>
          </div>
        )}
        
        {showDiscount && discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-bold">
            -{discount}%
          </div>
        )}

        <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-md text-xs">
          {product.category}
        </div>
      </div>

      <div className="p-4">
        {product.brand && (
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.brand}</p>
        )}
        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 h-10">{product.name}</h3>
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-blue-600">{formatPrice(product.minPrice)}</span>
          {product.maxPrice > product.minPrice && (
            <span className="text-sm text-gray-400 line-through">{formatPrice(product.maxPrice)}</span>
          )}
        </div>
        <div className="space-y-3 text-xs text-gray-600 mb-3">
          <div className="flex items-center justify-between">
            <span>
              🏪 {product.offersCount} {product.offersCount > 1 ? 'offres' : 'offre'}
            </span>
            {bestOffer?.merchant?.name && (
              <span className="text-gray-500">Meilleur prix : {bestOffer.merchant.name}</span>
            )}
          </div>
          <div className="space-y-1">
            {displayedOffers.map((offer) => (
              <a
                key={offer.id}
                href={offer.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between rounded-md bg-gray-50 hover:bg-gray-100 transition-colors px-3 py-2"
              >
                <div>
                  <p className="font-medium text-gray-700">{offer.merchant.name}</p>
                  <p className="text-[11px] text-gray-500">
                    {offer.shippingFee != null
                      ? offer.shippingFee > 0
                        ? `+ ${formatPrice(offer.shippingFee)} de livraison`
                        : 'Livraison offerte'
                      : 'Livraison NC'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatPrice(offer.totalPrice)}</span>
              </a>
            ))}
            {product.offers.length > displayedOffers.length && (
              <p className="text-[11px] text-gray-500">+ {product.offers.length - displayedOffers.length} autres offres disponibles</p>
            )}
          </div>
        </div>
        <a
          href={bestOffer?.url ?? '#'}
          target={bestOffer ? '_blank' : undefined}
          rel={bestOffer ? 'noopener noreferrer' : undefined}
          className={`w-full block text-center py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            bestOffer ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          aria-disabled={!bestOffer}
        >
          {bestOffer ? 'Voir la meilleure offre' : 'Aucune offre disponible'}
        </a>
      </div>
    </div>
  );
};
