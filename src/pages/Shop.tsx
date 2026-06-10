import React, { useState } from 'react';
import { useProducts } from '../context/ProductContext';
import ProductCard from '../components/ProductCard';
import { Search, Filter, ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const Shop = () => {
  const { t } = useLanguage();
  const { products } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold tracking-tighter text-gray-900 mb-4 uppercase">{t('shop.title')}</h1>
          <p className="text-gray-500 max-w-2xl">{t('shop.sub')}</p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white border border-gray-100 p-6 mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all border ${
                  selectedCategory === category
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                }`}
              >
                {category === 'All' ? (t('nav.home') === 'Home' ? 'All' : 'Todos') : category}
              </button>
            ))}
          </div>

          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('shop.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 focus:outline-none focus:border-red-600 text-sm transition-colors"
            />
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-gray-100">
            <p className="text-gray-400 font-medium">{t('shop.no_results')}</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
              className="mt-4 text-red-600 font-bold uppercase tracking-widest text-xs"
            >
              {t('shop.clear')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;
