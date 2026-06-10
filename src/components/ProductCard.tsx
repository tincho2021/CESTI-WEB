import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { ShoppingCart, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const { t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="group bg-white border border-gray-100 p-6 flex flex-col hover:shadow-xl hover:shadow-gray-100 transition-all duration-300 relative"
    >
      {product.smartReady && (
        <div className="absolute top-4 right-4 bg-black text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 flex items-center space-x-1 z-10">
          <Zap className="w-3 h-3 text-red-500 fill-red-500" />
          <span>{t('product.smart_ready')}</span>
        </div>
      )}

      <Link to={`/product/${product.id}`} className="mb-6 block overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full aspect-square object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
          referrerPolicy="no-referrer"
        />
      </Link>

      <div className="flex-grow">
        <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">
          {product.category}
        </span>
        <Link to={`/product/${product.id}`}>
          <h3 className="text-lg font-bold tracking-tight text-gray-900 mb-2 group-hover:text-red-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {Object.entries(product.specs).slice(0, 2).map(([key, value]) => (
            <div key={key} className="text-[10px] text-gray-500 uppercase">
              <span className="font-bold block text-gray-400">{key}</span>
              <span className="truncate block">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <span className="text-xl font-bold text-gray-900">${product.price}</span>
        <button
          onClick={() => addToCart(product)}
          className="bg-black text-white p-3 hover:bg-red-600 transition-colors rounded-sm"
        >
          <ShoppingCart className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
