import React from 'react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onCompare?: (product: Product) => void;
  showDiscount?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onCompare,
  showDiscount = false 
}) => {
  const handleCardClick = () => {
    window.location.href = `/product/${product.slug}`;
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCompare) {
      onCompare(product);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const discount = showDiscount && product.maxPrice > product.minPrice
    ? Math.round(((product.maxPrice - product.minPrice) / product.maxPrice) * 100)
    : 0;

  return (
    <div 
      onClick={handleCardClick}
      className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden group"
    >
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
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            {product.brand}
          </p>
        )}

        <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2 h-10">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(product.minPrice)}
          </span>
          {product.maxPrice > product.minPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.maxPrice)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span className="flex items-center">
            🏪 {product.offersCount} {product.offersCount > 1 ? 'offres' : 'offre'}
          </span>
          {product.offersCount > 1 && (
            <span className="text-green-600 font-medium">
              Comparer
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCardClick}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Voir les offres
          </button>
          {onCompare && (
            <button
              onClick={handleCompareClick}
              className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
              title="Ajouter à la comparaison"
            >
              ⚖️
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
