import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, ArrowLeft, Download, CheckCircle2, Zap, Package, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { products } = useProducts();
  const [quantity, setQuantity] = useState(1);

  const product = products.find(p => p.id === id);

  if (!product) {
    return (
      <div className="pt-40 pb-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <Link to="/shop" className="text-red-600 font-bold uppercase tracking-widest">{t('product.back')} to Shop</Link>
      </div>
    );
  }

  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="pt-32 pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-12 transition-colors"
        >
          <ArrowLeft className="mr-2 w-4 h-4" /> {t('product.back')}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-32">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div className="bg-gray-50 aspect-square overflow-hidden border border-gray-100">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                referrerPolicy="no-referrer"
              />
            </div>
            {product.smartReady && (
              <div className="absolute top-6 right-6 bg-black text-white px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] flex items-center space-x-2">
                <Zap className="w-4 h-4 text-red-500 fill-red-500" />
                <span>{t('product.smart_ready')} Ecosystem</span>
              </div>
            )}
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-600 mb-4 block">
              {product.category}
            </span>
            <h1 className="text-5xl font-bold tracking-tighter text-gray-900 mb-6 uppercase leading-none">
              {product.name}
            </h1>
            <div className="flex items-center space-x-4 mb-8">
              <span className="text-3xl font-bold text-gray-900">${product.price}</span>
              <div className="h-6 w-[1px] bg-gray-200" />
              <div className="flex items-center text-green-600 text-xs font-bold uppercase tracking-widest">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                {t('product.in_stock')} ({product.stock} {t('product.units')})
              </div>
            </div>

            <p className="text-gray-500 text-lg leading-relaxed mb-10">
              {product.description}
            </p>

            <div className="grid grid-cols-2 gap-8 mb-12 p-8 bg-gray-50 border border-gray-100">
              {Object.entries(product.specs).map(([key, value]) => (
                <div key={key}>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{key}</p>
                  <p className="text-sm font-bold text-gray-900 uppercase">{value}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
              <div className="flex border border-gray-200">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-4 hover:bg-gray-100 transition-colors border-r border-gray-200"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center focus:outline-none font-bold"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="px-4 py-4 hover:bg-gray-100 transition-colors border-l border-gray-200"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => addToCart(product, quantity)}
                className="flex-grow bg-black text-white px-8 py-4 font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-all flex items-center justify-center space-x-3"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{t('product.add_to_cart')}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-6 border-t border-gray-100 pt-8">
              <button className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors">
                <Download className="w-4 h-4 mr-2" /> {t('product.download')}
              </button>
              <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <ShieldCheck className="w-4 h-4 mr-2" /> {t('product.warranty')}
              </div>
              <div className="flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <Package className="w-4 h-4 mr-2" /> {t('product.shipping')}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold tracking-tighter text-gray-900 mb-12 uppercase">{t('product.related')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
