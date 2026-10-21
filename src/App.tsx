import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { CartProvider } from './context/CartContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProductProvider } from './context/ProductContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import CotizacionOnline from './pages/CotizacionOnline';
import Vista3D from './pages/Vista3D';
import WhatsAppButton from './components/WhatsAppButton';

// Scroll to top on route change
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);

  return null;
}

function Frame() {
  const { pathname } = useLocation();
  const studio = pathname.startsWith('/cotizacion-online') || pathname.startsWith('/vista-3d') || pathname.startsWith('/demo-visual');

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 selection:bg-red-600 selection:text-white">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/cotizacion-online" element={<CotizacionOnline />} />
          <Route path="/vista-3d" element={<Vista3D />} />
          <Route path="/demo-visual" element={<Navigate to="/vista-3d" replace />} />
        </Routes>
      </main>
      {!studio && <Footer />}
      {!studio && <WhatsAppButton />}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <ProductProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <Frame />
          </Router>
        </CartProvider>
      </ProductProvider>
    </LanguageProvider>
  );
}
