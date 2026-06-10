import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, Cpu } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
  const { totalItems } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.shop'), path: '/shop' },
    { name: t('nav.solutions'), path: '/#solutions' },
    { name: t('nav.smart'), path: '/#smart' },
    { name: t('nav.contact'), path: '/contact' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-10 h-10 bg-black flex items-center justify-center rounded-sm group-hover:bg-red-600 transition-colors">
              <Cpu className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tighter leading-none">C.E.S.T.I</span>
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">{t('nav.industrial')}</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={cn(
                  "text-sm font-medium tracking-tight hover:text-red-600 transition-colors",
                  location.pathname === link.path ? "text-red-600" : "text-gray-600"
                )}
              >
                {link.name}
              </Link>
            ))}

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
          </div>

          {/* Mobile Menu Toggle */}
          <div className="md:hidden flex items-center space-x-4">
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
            className="md:hidden bg-white border-b border-gray-100 px-4 py-6 space-y-4"
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
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
