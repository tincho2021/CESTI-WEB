import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Settings } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Logo from './Logo';

const Navbar = () => {
  const { totalItems } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.shop'), path: '/shop?dept=combustible' },
    { name: t('nav.electronics'), path: '/shop?dept=electronica' },
    { name: t('nav.solutions'), path: '/#solutions' },
    { name: t('nav.smart'), path: '/#smart' },
    { name: t('nav.contact'), path: '/contact' },
  ];

  const quoteActive = location.pathname.startsWith('/cotizacion-online');
  const demoActive = location.pathname.startsWith('/demo-visual');

  const isLinkActive = (path: string) => {
    const current = location.pathname + location.search;
    // For hash navigation
    if (path.includes('#')) {
      return location.pathname === '/' && location.hash === path.substring(1);
    }
    // Exact or partial query string match
    return current === path || (path === '/' && current === '/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-3 group header-logo-link">
            <Logo variant="icon" className="w-10 h-10 transition-transform duration-500 group-hover:rotate-12" />
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-[#011832] leading-none mb-1">C.E.S.T.I.</span>
              <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">{t('nav.industrial')}</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-5">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "text-sm font-medium tracking-tight hover:text-red-600 transition-colors",
                  isLinkActive(link.path) ? "text-red-600 font-bold border-b border-red-600" : "text-gray-600"
                )}
              >
                {link.name}
              </Link>
            ))}

            <Link
              to="/demo-visual"
              className={cn(
                "px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm border transition-colors",
                demoActive ? "border-[#011832] bg-[#011832] text-white" : "border-gray-200 text-[#011832] hover:border-[#011832]"
              )}
            >
              Demo visual
            </Link>
            <Link
              to="/cotizacion-online"
              className={cn(
                "px-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-colors",
                quoteActive ? "bg-red-600 text-white" : "bg-[#011832] text-white hover:bg-red-600"
              )}
            >
              {t('nav.quote')}
            </Link>

            {/* Language Switcher */}
            <div className="flex items-center border border-gray-100 rounded-sm overflow-hidden">
              <button
                onClick={() => setLanguage('en')}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                  language === 'en' ? "bg-black text-white" : "bg-white text-gray-400 hover:text-black"
                )}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={cn(
                  "px-2 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                  language === 'es' ? "bg-black text-white" : "bg-white text-gray-400 hover:text-black"
                )}
              >
                ES
              </button>
            </div>

            <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>

            <Link
              to="/admin"
              title="Panel de Administración de Catálogo"
              className={cn(
                "flex items-center space-x-1.5 px-3 py-1.5 border rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors",
                location.pathname === '/admin'
                  ? "bg-red-600 text-white border-red-600"
                  : "border-gray-200 text-gray-700 hover:bg-black hover:text-white hover:border-black"
              )}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center space-x-2">
            <Link to="/demo-visual" className="px-2 py-1.5 border border-[#011832] text-[#011832] text-[9px] font-bold uppercase tracking-widest">
              Demo
            </Link>
            <Link to="/cotizacion-online" className="px-2 py-1.5 bg-[#011832] text-white text-[9px] font-bold uppercase tracking-widest">
              Cotizar
            </Link>
            <Link to="/cart" className="relative p-2">
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {totalItems > 0 && (
                <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                  {totalItems}
                </span>
              )}
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="lg:hidden bg-white border-b border-gray-100 px-4 py-6 space-y-4"
          >
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block text-lg font-medium text-gray-900"
              >
                {link.name}
              </Link>
            ))}
            <Link
              to="/demo-visual"
              onClick={() => setIsOpen(false)}
              className="block text-lg font-bold text-[#011832]"
            >
              Demo visual
            </Link>
            <Link
              to="/cotizacion-online"
              onClick={() => setIsOpen(false)}
              className="block text-lg font-bold text-white bg-[#011832] px-3 py-2"
            >
              {t('nav.quote')}
            </Link>
            <Link
              to="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center space-x-2 text-lg font-bold text-red-600 pt-2 border-t border-gray-100"
            >
              <Settings className="w-5 h-5" />
              <span>Panel Admin (Catálogo)</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
