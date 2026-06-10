import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Cpu, Activity, ShieldCheck, Zap, Layers, Settings } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { t } = useLanguage();
  const { products } = useProducts();

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center bg-gray-50 pb-20 md:pb-0">
        <div className="absolute inset-0 z-0 overflow-hidden bg-gray-50">
          {/* Technical Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.03]" 
            style={{ 
              backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
              backgroundSize: '40px 40px' 
            }} 
          />
          
          {/* Hero Background Image */}
          <img
            src="/images/hero-bg.png"
            alt="C.E.S.T.I Industrial Intelligence"
            className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
          />
          
          {/* Abstract Schematic Elements */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.05] pointer-events-none" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dotGrid" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="0.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dotGrid)" />
            
            {/* Abstract technical lines */}
            <path d="M 100 0 L 100 1000 M 900 0 L 900 1000 M 0 200 L 1000 200 M 0 800 L 1000 800" stroke="currentColor" strokeWidth="0.5" fill="none" />
            <path d="M 100 200 L 200 300 L 200 500 L 100 600" stroke="currentColor" strokeWidth="1" fill="none" />
            <path d="M 900 800 L 800 700 L 800 500 L 900 400" stroke="currentColor" strokeWidth="1" fill="none" />
            
            {/* Technical circles/nodes */}
            <circle cx="100" cy="200" r="4" fill="currentColor" />
            <circle cx="900" cy="800" r="4" fill="currentColor" />
            <circle cx="200" cy="300" r="3" fill="currentColor" />
            <circle cx="800" cy="700" r="3" fill="currentColor" />
          </svg>

          <div className="absolute inset-0 bg-gradient-to-r from-gray-100/70 via-white/20 to-transparent z-10" />
          
          {/* UI Overlays Mock */}
          <div className="absolute top-1/4 right-10 w-64 h-64 border border-gray-200 rounded-full animate-pulse opacity-20 hidden lg:block z-20" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 border border-gray-200 rounded-full animate-pulse opacity-10 hidden lg:block z-20" />
          <div className="absolute top-1/2 right-1/3 w-48 h-48 border border-red-600/10 rounded-full animate-ping hidden lg:block z-20" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-20 py-20">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl"
          >
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-12 h-[2px] bg-red-600" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-600">{t('hero.tag')}</span>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-[0.9] text-gray-900 mb-8">
              {t('hero.title.part1')} <br />
              <span className="text-gray-400">{t('hero.title.part2')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10 leading-relaxed font-medium">
              {t('hero.sub')}
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to="/shop"
                className="bg-black text-white px-10 py-5 font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-all flex items-center justify-center group"
              >
                {t('hero.cta.shop')}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                className="border-2 border-black text-black px-10 py-5 font-bold uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all flex items-center justify-center"
              >
                {t('hero.cta.custom')}
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid - Integrated into flow */}
          <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
            {[
              { label: t('stat.uptime'), value: '99.99%', icon: Activity },
              { label: t('stat.response'), value: '< 10ms', icon: Zap },
              { label: t('stat.security'), value: 'AES-256', icon: ShieldCheck },
              { label: t('stat.nodes'), value: '500k+', icon: Layers },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="bg-white border border-gray-100 p-4 md:p-6 flex items-center space-x-4 shadow-lg shadow-gray-100/50"
              >
                <stat.icon className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold leading-none mb-1">{stat.label}</p>
                  <p className="text-base md:text-lg font-bold text-gray-900 leading-none">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold tracking-tighter text-gray-900 mb-4 uppercase">{t('shop.title')}</h2>
              <p className="text-gray-500 font-medium">{t('shop.sub')}</p>
            </div>
            <Link to="/shop" className="text-sm font-bold uppercase tracking-widest text-red-600 hover:text-black transition-colors mt-6 md:mt-0 flex items-center">
              {t('shop.view_all')} <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.slice(0, 3).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Smart Systems Section */}
      <section id="smart" className="py-32 bg-gray-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <div className="grid grid-cols-10 gap-4 h-full">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="border border-white/20 aspect-square" />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-12 h-[2px] bg-red-600" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-600">{t('smart.tag')}</span>
              </div>
              <h2 className="text-5xl font-bold tracking-tighter mb-8 leading-tight">
                {t('smart.title')} <br />
                <span className="text-red-600">{t('smart.title.accent')}</span>
              </h2>
              <p className="text-gray-400 text-lg mb-12 leading-relaxed">
                {t('smart.desc')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-12">
                {[
                  { title: t('smart.feat1.title'), desc: t('smart.feat1.desc') },
                  { title: t('smart.feat2.title'), desc: t('smart.feat2.desc') },
                  { title: t('smart.feat3.title'), desc: t('smart.feat3.desc') },
                  { title: t('smart.feat4.title'), desc: t('smart.feat4.desc') },
                ].map((item) => (
                  <div key={item.title} className="border-l-2 border-red-600 pl-6">
                    <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="bg-gray-800 border border-gray-700 p-8 rounded-sm shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-widest">{t('smart.status')}</span>
                  </div>
                  <Settings className="w-5 h-5 text-gray-500" />
                </div>

                {/* Mock Chart */}
                <div className="h-64 flex items-end space-x-2 mb-8">
                  {[40, 70, 45, 90, 65, 80, 50, 85, 60, 95, 75, 85].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      className="flex-1 bg-red-600/20 border-t-2 border-red-600"
                    />
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-900 p-4 border border-gray-700">
                    <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Temp</p>
                    <p className="text-xl font-bold">42.5°C</p>
                  </div>
                  <div className="bg-gray-900 p-4 border border-gray-700">
                    <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Pressure</p>
                    <p className="text-xl font-bold">12.4 Bar</p>
                  </div>
                  <div className="bg-gray-900 p-4 border border-gray-700">
                    <p className="text-[10px] uppercase text-gray-500 font-bold mb-1">Load</p>
                    <p className="text-xl font-bold">88%</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Custom Solutions Section */}
      <section id="solutions" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-5xl font-bold tracking-tighter text-gray-900 mb-6 uppercase">{t('solutions.title')}</h2>
            <p className="text-gray-500 text-lg">{t('solutions.sub')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: t('solutions.feat1.title'), icon: Layers, desc: t('solutions.feat1.desc') },
              { title: t('solutions.feat2.title'), icon: Cpu, desc: t('solutions.feat2.desc') },
              { title: t('solutions.feat3.title'), icon: Activity, desc: t('solutions.feat3.desc') },
            ].map((solution) => (
              <div key={solution.title} className="group p-10 border border-gray-100 hover:border-red-600 transition-colors text-center">
                <div className="w-16 h-16 bg-gray-50 flex items-center justify-center mx-auto mb-8 group-hover:bg-red-600 transition-colors">
                  <solution.icon className="w-8 h-8 text-gray-900 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-4 uppercase tracking-tight">{solution.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">{solution.desc}</p>
                <Link to="/contact" className="text-xs font-bold uppercase tracking-widest text-red-600 hover:text-black transition-colors">
                  {t('solutions.learn_more')}
                </Link>
              </div>
            ))}
          </div>

          <div className="mt-20 bg-black p-12 text-white flex flex-col md:flex-row items-center justify-between">
            <div>
              <h3 className="text-3xl font-bold tracking-tight mb-2">{t('solutions.cta.title')}</h3>
              <p className="text-gray-400">{t('solutions.cta.sub')}</p>
            </div>
            <Link to="/contact" className="mt-8 md:mt-0 bg-red-600 text-white px-10 py-5 font-bold uppercase tracking-widest text-sm hover:bg-white hover:text-black transition-all">
              {t('solutions.cta.btn')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
