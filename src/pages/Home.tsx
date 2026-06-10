import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Cpu, Activity, ShieldCheck, Zap, Layers, Settings } from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import ProductCard from '../components/ProductCard';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
  const { t, language } = useLanguage();
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

      {/* Flagship Product: IoT Telemetry & Monitoring Section */}
      <section id="smart" className="py-32 bg-slate-950 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-[0.03] pointer-events-none">
          <div className="grid grid-cols-10 gap-4 h-full">
            {Array.from({ length: 100 }).map((_, i) => (
              <div key={i} className="border border-white/10 aspect-square" />
            ))}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-12 h-[2px] bg-red-600" />
                <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-600">
                  {language === 'es' ? 'PRODUCTO ESTRELLA' : 'FLAGSHIP PRODUCT'}
                </span>
              </div>
              <h2 className="text-5xl font-extrabold tracking-tighter mb-8 leading-tight">
                {language === 'es' ? 'Plataforma de Monitoreo' : 'IoT Telemetry'} <br />
                <span className="text-[#00b0ff]">CESTI IoT</span>
              </h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                {language === 'es' 
                  ? 'Nuestra solución de telemedición premium en tiempo real. Monitoree de forma remota tanques, cisternas, despachos de combustibles y flotas mediante hardware ESP32 de alta confiabilidad y de última generación.' 
                  : 'Our premium real-time telemetry solution. Remotely monitor tanks, cisterns, fuel dispenses, and fleets using highly reliable, cutting-edge ESP32 hardware.'}
              </p>

              <div className="space-y-6 mb-12">
                {[
                  { 
                    title: language === 'es' ? 'Monitoreo de Telemedición de Tanques' : 'Cistern & Tank Telemetry', 
                    desc: language === 'es' ? 'Visualización exacta en litros, porcentaje de capacidad y temperatura de combustible.' : 'Accurate volume tracking in liters, capacity percentage, and fuel temperatures.' 
                  },
                  { 
                    title: language === 'es' ? 'Integración ESP32 Directa' : 'Native ESP32 Integration', 
                    desc: language === 'es' ? 'Envío constante de telemetría segura mediante módulos microcontroladores.' : 'Constant secure telemetry streaming through robust microcontroller modules.' 
                  },
                  { 
                    title: language === 'es' ? 'Estado y Alertas de Surtidores' : 'Dispenser Alerts & Status', 
                    desc: language === 'es' ? 'Control de despachos y detección temprana de anomalías con notificaciones directas.' : 'Dispensing logs and early anomaly detection with direct automated notifications.' 
                  },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start space-x-4">
                    <div className="w-2 h-2 mt-2 bg-[#00b0ff] rounded-full shrink-0" />
                    <div>
                      <h4 className="font-bold text-base text-gray-100">{item.title}</h4>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <a
                  href="https://nimble-rugelach-c87394.netlify.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center bg-[#00b0ff] hover:bg-red-600 text-black hover:text-white px-8 py-4 font-bold uppercase tracking-widest text-xs transition-all duration-300 rounded-sm shadow-lg shadow-[#00b0ff]/20 gap-3 group"
                >
                  {language === 'es' ? 'PROBAR DEMO EN VIVO' : 'TEST LIVE DEMO'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                </a>
                
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center border border-gray-700 hover:border-white px-8 py-4 font-bold uppercase tracking-widest text-xs transition-all duration-300 rounded-sm"
                >
                  {language === 'es' ? 'SOLICITAR COTIZACIÓN' : 'GET A QUOTE'}
                </Link>
              </div>
            </motion.div>

            {/* Simulated Live Dashboard Mockup inspired directly by the screenshot */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-sm shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00b0ff] to-red-600" />
                
                {/* Header of Simulated Dashboard */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-5 mb-6 gap-3">
                  <div>
                    <span className="text-[10px] tracking-wider font-bold text-gray-500 uppercase">
                      {language === 'es' ? 'CENTRO DE OPERACIONES' : 'OPERATIONS HUB'}
                    </span>
                    <h3 className="text-lg font-black tracking-tight text-white mt-0.5">ESCOBAR</h3>
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <span className="inline-flex items-center px-2.5 py-0.5 text-[9px] font-bold tracking-wider rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase animate-pulse">
                      ● {language === 'es' ? 'SISTEMA ESTABLE' : 'STABLE SYSTEM'}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500">v1.2.0</span>
                  </div>
                </div>

                {/* Simulated Key Indicators */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-sm">
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                      {language === 'es' ? 'STOCK DISPONIBLE' : 'AVAILABLE STOCK'}
                    </p>
                    <p className="text-xl font-extrabold text-[#00b0ff]">55.960 L</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">86% {language === 'es' ? 'capacidad general' : 'general capacity'}</p>
                  </div>
                  
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-sm">
                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                      {language === 'es' ? 'TELEMEDICIÓN ESP32' : 'ESP32 TELEMETRY'}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                      <p className="text-base font-extrabold text-emerald-400 font-mono">ONLINE</p>
                    </div>
                    <p className="text-[9px] text-slate-500 font-mono mt-1">Ping: 8ms • RSSI: -65dBm</p>
                  </div>
                </div>

                {/* Tanks Containers (Simulated Tank Levels) */}
                <div className="space-y-4">
                  <div className="text-[10px] tracking-wider font-extrabold text-slate-500 uppercase mb-2">
                    {language === 'es' ? 'MONITOREO DE TELEMEDICIÓN DE TANQUES' : 'TANK TELEMETRY MEASURES'}
                  </div>
                  
                  {/* Tank 1 */}
                  <div className="bg-slate-950/80 border border-slate-800/60 p-4 rounded-sm">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-gray-200">Cisterna Diesel Comun <span className="text-[9px] font-mono text-slate-400">(tank_02)</span></span>
                      <span className="text-xs font-black text-[#00b0ff]">18.680 L <span className="text-[10px] font-light text-slate-400">(93%)</span></span>
                    </div>
                    {/* Level Bar */}
                    <div className="w-full h-3 bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '93%' }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className="h-full bg-gradient-to-r from-[#0082c8] to-[#00b0ff]"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5 text-[9px] font-mono text-slate-500">
                      <span>Temp: 15.8°C</span>
                      <span>Agua: 4mm</span>
                    </div>
                  </div>

                  {/* Tank 2 */}
                  <div className="bg-slate-950/80 border border-slate-800/60 p-4 rounded-sm">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-gray-200">Cisterna Nafta Super <span className="text-[9px] font-mono text-slate-400">(tank_03)</span></span>
                      <span className="text-xs font-black text-emerald-400">13.480 L <span className="text-[10px] font-light text-slate-400">(90%)</span></span>
                    </div>
                    {/* Level Bar */}
                    <div className="w-full h-3 bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '90%' }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5 text-[9px] font-mono text-slate-500">
                      <span>Temp: 17.2°C</span>
                      <span>Agua: 0mm</span>
                    </div>
                  </div>

                  {/* Tank 3 */}
                  <div className="bg-slate-950/80 border border-slate-800/60 p-4 rounded-sm">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-bold text-gray-200">Cisterna Gasoil Premium <span className="text-[9px] font-mono text-slate-400">(tank_01)</span></span>
                      <span className="text-xs font-black text-[#00b0ff]">23.800 L <span className="text-[10px] font-light text-slate-400">(79%)</span></span>
                    </div>
                    {/* Level Bar */}
                    <div className="w-full h-3 bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: '79%' }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="h-full bg-gradient-to-r from-blue-700 to-teal-400"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1.5 text-[9px] font-mono text-slate-500">
                      <span>Temp: 16.4°C</span>
                      <span>Agua: 0mm</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800/60 text-center">
                  <a 
                    href="https://nimble-rugelach-c87394.netlify.app/"
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center justify-center text-xs text-[#00b0ff] hover:text-red-400 font-extrabold tracking-wider uppercase gap-2 transition-colors cursor-pointer"
                  >
                    {language === 'es' ? 'ABRIR DEMO COMPLETA' : 'OPEN FULL LIVE DEMO'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
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
