import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../context/ProductContext';
import ProductCard from '../components/ProductCard';
import { Search, Cpu, Gauge, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const Shop = () => {
  const { t, language } = useLanguage();
  const { products } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const urlDept = searchParams.get('dept');
  
  // Department filter state
  const [selectedDepartment, setSelectedDepartment] = useState<'All' | 'combustible' | 'electronica'>(
    urlDept === 'electronica' || urlDept === 'combustible' ? urlDept : 'All'
  );
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sync state whenever searchParams change (e.g. when clicking different navbar links)
  useEffect(() => {
    const dept = searchParams.get('dept');
    if (dept === 'electronica' || dept === 'combustible') {
      setSelectedDepartment(dept);
    } else {
      setSelectedDepartment('All');
    }
    setSelectedCategory('All');
  }, [searchParams]);

  // Safe helper to resolve department
  const getProductDept = (product: any): 'combustible' | 'electronica' => {
    return product.department === 'electronica' ? 'electronica' : 'combustible';
  };

  // Filter products by active department
  const departmentFiltered = products.filter(p => {
    if (selectedDepartment === 'All') return true;
    return getProductDept(p) === selectedDepartment;
  });

  // Calculate matching categories based on current department
  const categories = ['All', ...Array.from(new Set(departmentFiltered.map(p => p.category)))];

  // Final filtered list based on search and sub-category
  const filteredProducts = departmentFiltered.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleDepartmentChange = (dept: 'All' | 'combustible' | 'electronica') => {
    setSelectedDepartment(dept);
    setSelectedCategory('All');
    if (dept === 'All') {
      searchParams.delete('dept');
    } else {
      searchParams.set('dept', dept);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold tracking-tighter text-gray-900 mb-4 uppercase">
            {t('shop.title')}
          </h1>
          <p className="text-gray-500 max-w-2xl">
            {t('shop.sub')}
          </p>
        </div>

        {/* Dynamic Department / Sector Selector */}
        <div className="mb-12">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-gray-400 mb-4">
            {t('shop.dept.title')}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* All Departments */}
            <button
              onClick={() => handleDepartmentChange('All')}
              className={`p-6 border text-left rounded-sm transition-all relative overflow-hidden group cursor-pointer ${
                selectedDepartment === 'All'
                  ? 'bg-black text-white border-black shadow-lg shadow-gray-200'
                  : 'bg-white text-gray-900 border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-full mb-3 ${
                    selectedDepartment === 'All' ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {language === 'es' ? 'CATÁLOGO TOTAL' : 'FULL CATALOG'}
                  </span>
                  <h3 className="text-lg font-black tracking-tight uppercase leading-none mb-1">
                    {language === 'es' ? 'Ver Todo' : 'Show All'}
                  </h3>
                  <p className={`text-xs mt-2 leading-relaxed ${
                    selectedDepartment === 'All' ? 'text-gray-300' : 'text-gray-400'
                  }`}>
                    {language === 'es' 
                      ? 'Explora el catálogo completo sin filtros de sector industrial.' 
                      : 'Explore the complete catalog containing both divisions.'}
                  </p>
                </div>
                <ShoppingBag className={`w-8 h-8 shrink-0 ml-4 ${
                  selectedDepartment === 'All' ? 'text-red-500' : 'text-gray-300 group-hover:text-black transition-colors'
                }`} />
              </div>
            </button>

            {/* Fuel Technology Department */}
            <button
              onClick={() => handleDepartmentChange('combustible')}
              className={`p-6 border text-left rounded-sm transition-all relative overflow-hidden group cursor-pointer ${
                selectedDepartment === 'combustible'
                  ? 'bg-black text-white border-black shadow-lg shadow-gray-200'
                  : 'bg-white text-gray-900 border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-full mb-3 ${
                    selectedDepartment === 'combustible' ? 'bg-red-500/20 text-red-400' : 'bg-red-50/70 text-red-600'
                  }`}>
                    {language === 'es' ? 'DIVISIÓN HIDROCARBUROS' : 'FUEL DIVISION'}
                  </span>
                  <h3 className="text-lg font-black tracking-tight uppercase leading-none mb-1">
                    {t('shop.dept.combustible')}
                  </h3>
                  <p className={`text-xs mt-2 leading-relaxed ${
                    selectedDepartment === 'combustible' ? 'text-gray-300' : 'text-gray-400'
                  }`}>
                    {t('shop.dept.combustible.desc')}
                  </p>
                </div>
                <Gauge className={`w-8 h-8 shrink-0 ml-4 ${
                  selectedDepartment === 'combustible' ? 'text-red-500' : 'text-gray-300 group-hover:text-black transition-colors'
                }`} />
              </div>
            </button>

            {/* Electronics Department */}
            <button
              onClick={() => handleDepartmentChange('electronica')}
              className={`p-6 border text-left rounded-sm transition-all relative overflow-hidden group cursor-pointer ${
                selectedDepartment === 'electronica'
                  ? 'bg-black text-white border-black shadow-lg shadow-gray-200'
                  : 'bg-white text-gray-900 border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-widest rounded-full mb-3 ${
                    selectedDepartment === 'electronica' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
                  }`}>
                    {language === 'es' ? 'DIVISIÓN COMPONENTES' : 'ELECTRONICS DIVISION'}
                  </span>
                  <h3 className="text-lg font-black tracking-tight uppercase leading-none mb-1">
                    {t('shop.dept.electronica')}
                  </h3>
                  <p className={`text-xs mt-2 leading-relaxed ${
                    selectedDepartment === 'electronica' ? 'text-gray-300' : 'text-gray-400'
                  }`}>
                    {t('shop.dept.electronica.desc')}
                  </p>
                </div>
                <Cpu className={`w-8 h-8 shrink-0 ml-4 ${
                  selectedDepartment === 'electronica' ? 'text-cyan-400' : 'text-gray-300 group-hover:text-black transition-colors'
                }`} />
              </div>
            </button>

          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white border border-gray-100 p-6 mb-12 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          
          {/* Sub-Categories Tag Filter list */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border ${
                  selectedCategory === category
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-gray-500 border-gray-100 hover:border-gray-300'
                }`}
              >
                {category === 'All' ? (language === 'es' ? 'TODAS LAS CATEGORÍAS' : 'ALL CATEGORIES') : category}
              </button>
            ))}
          </div>

          {/* Search bar inside scoped category */}
          <div className="relative flex-grow max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('shop.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 focus:outline-none focus:border-red-600 text-sm transition-colors rounded-sm"
            />
          </div>

        </div>

        {/* Product Grid Section */}
        {filteredProducts.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                {language === 'es' ? `Mostrando ${filteredProducts.length} productos` : `Showing ${filteredProducts.length} products`}
              </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white border border-gray-100">
            <p className="text-gray-400 font-medium">{t('shop.no_results')}</p>
            <button
              onClick={() => { setSelectedCategory('All'); setSearchQuery(''); handleDepartmentChange('All'); }}
              className="mt-4 text-red-600 font-bold uppercase tracking-widest text-xs cursor-pointer hover:text-black transition-colors"
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
