import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Linkedin, Twitter, Github } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Logo from './Logo';

const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="bg-white border-t border-gray-100 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-3 mb-6 group footer-brand-link">
              <Logo variant="icon" className="w-9 h-9 transition-transform duration-500 group-hover:rotate-12" />
              <span className="text-xl font-extrabold tracking-tight text-[#011832]">C.E.S.T.I.</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              {t('footer.desc')}
            </p>
            <div className="flex space-x-4">
              <Linkedin className="w-5 h-5 text-gray-400 hover:text-black cursor-pointer transition-colors" />
              <Twitter className="w-5 h-5 text-gray-400 hover:text-black cursor-pointer transition-colors" />
              <Github className="w-5 h-5 text-gray-400 hover:text-black cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6">{t('nav.solutions')}</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/shop" className="hover:text-red-600 transition-colors">{t('solutions.feat2.title')}</Link></li>
              <li><Link to="/shop" className="hover:text-red-600 transition-colors">{t('nav.smart')}</Link></li>
              <li><Link to="/shop" className="hover:text-red-600 transition-colors">{t('solutions.feat1.title')}</Link></li>
              <li><Link to="/shop" className="hover:text-red-600 transition-colors">{t('solutions.feat3.title')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-red-600 transition-colors">{t('nav.home')}</Link></li>
              <li><Link to="/shop" className="hover:text-red-600 transition-colors">{t('nav.shop')}</Link></li>
              <li><Link to="/#solutions" className="hover:text-red-600 transition-colors">{t('nav.solutions')}</Link></li>
              <li><Link to="/contact" className="hover:text-red-600 transition-colors">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-900 mb-6">{t('contact.info')}</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li className="flex items-center space-x-3">
                <Mail className="w-4 h-4 text-red-600" />
                <span>martinrodriguezmelgarejo@gmail.com</span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-4 h-4 text-red-600" />
                <span>+54 9 11 2182-9346</span>
              </li>
              <li className="flex items-center space-x-3">
                <MapPin className="w-4 h-4 text-red-600" />
                <span>{t('contact.address_val')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-400 uppercase tracking-widest">
          <p>© 2026 C.E.S.T.I. {t('footer.rights')}</p>
          <div className="flex space-x-8 mt-4 md:mt-0 items-center">
            <Link to="/admin" className="hover:text-red-600 transition-all bg-gray-50 border border-gray-100 px-2.5 py-1 text-[9px] font-bold rounded-sm tracking-widest">
              Admin Panel
            </Link>
            <span className="hover:text-black cursor-pointer">{t('footer.privacy')}</span>
            <span className="hover:text-black cursor-pointer">{t('footer.terms')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
