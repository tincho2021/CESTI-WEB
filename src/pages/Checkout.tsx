import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, CreditCard, Truck, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const Checkout = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    }, 2500);
  };

  if (isSuccess) {
    return (
      <div className="pt-40 pb-20 text-center min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md px-4"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-4xl font-bold tracking-tighter text-gray-900 mb-4 uppercase">{t('checkout.confirmed')}</h2>
          <p className="text-gray-500 mb-10 leading-relaxed">
            {t('checkout.confirmed_desc')} <strong>{formData.email}</strong>.
          </p>
          <Link
            to="/"
            className="bg-black text-white px-10 py-5 font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-all inline-block"
          >
            {t('checkout.return')}
          </Link>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="pt-40 pb-20 text-center">
        <h2 className="text-2xl font-bold mb-4 uppercase">{t('checkout.no_items')}</h2>
        <Link to="/shop" className="text-red-600 font-bold uppercase tracking-widest">{t('product.back')} to Shop</Link>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/cart" className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-12 transition-colors">
          <ArrowLeft className="mr-2 w-4 h-4" /> {t('checkout.back_cart')}
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Form Section */}
          <div>
            <h1 className="text-4xl font-bold tracking-tighter text-gray-900 mb-12 uppercase">{t('cart.checkout')}</h1>
            
            <form onSubmit={handleSubmit} className="space-y-12">
              {/* Contact Information */}
              <section>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-bold">01</div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">{t('checkout.contact')}</h3>
                </div>
                <div className="space-y-4">
                  <input
                    required
                    type="email"
                    name="email"
                    placeholder={t('checkout.email')}
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-white border border-gray-100 focus:outline-none focus:border-red-600 text-sm transition-colors"
                  />
                </div>
              </section>

              {/* Shipping Information */}
              <section>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-bold">02</div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">{t('checkout.shipping_details')}</h3>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    required
                    type="text"
                    name="firstName"
                    placeholder={t('checkout.first_name')}
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-white border border-gray-100 focus:outline-none focus:border-red-600 text-sm transition-colors"
                  />
                  <input
                    required
                    type="text"
                    name="lastName"
                    placeholder={t('checkout.last_name')}
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-white border border-gray-100 focus:outline-none focus:border-red-600 text-sm transition-colors"
                  />
                </div>
                <input
                  required
                  type="text"
                  name="address"
                  placeholder={t('checkout.address')}
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 bg-white border border-gray-100 focus:outline-none focus:border-red-600 text-sm transition-colors mb-4"
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    required
                    type="text"
                    name="city"
                    placeholder={t('checkout.city')}
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-white border border-gray-100 focus:outline-none focus:border-red-600 text-sm transition-colors"
                  />
                  <input
                    required
                    type="text"
                    name="zipCode"
                    placeholder={t('checkout.zip')}
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-white border border-gray-100 focus:outline-none focus:border-red-600 text-sm transition-colors"
                  />
                </div>
              </section>

              {/* Payment Information */}
              <section>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-bold">03</div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">{t('checkout.payment')}</h3>
                </div>
                <div className="bg-white border border-gray-100 p-6 mb-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5 text-gray-400" />
                      <span className="text-sm font-bold uppercase tracking-widest">{t('checkout.card')}</span>
                    </div>
                    <div className="flex space-x-2 grayscale opacity-50">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-3" referrerPolicy="no-referrer" />
                      <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" referrerPolicy="no-referrer" />
                    </div>
                  </div>
                  <input
                    required
                    type="text"
                    name="cardNumber"
                    placeholder={t('checkout.card_num')}
                    value={formData.cardNumber}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-100 focus:outline-none focus:border-red-600 text-sm transition-colors mb-4"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      required
                      type="text"
                      name="expiry"
                      placeholder="MM / YY"
                      value={formData.expiry}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 focus:outline-none focus:border-red-600 text-sm transition-colors"
                    />
                    <input
                      required
                      type="text"
                      name="cvv"
                      placeholder="CVV"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 bg-gray-50 border border-gray-100 focus:outline-none focus:border-red-600 text-sm transition-colors"
                    />
                  </div>
                </div>
              </section>

              <button
                disabled={isProcessing}
                type="submit"
                className="w-full bg-black text-white py-6 font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-all flex items-center justify-center disabled:bg-gray-400"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{t('checkout.processing')}</span>
                  </div>
                ) : (
                  <span>{t('checkout.complete')} — ${totalPrice.toFixed(2)}</span>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary Section */}
          <div className="lg:pl-20">
            <div className="bg-white border border-gray-100 p-10 sticky top-32">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-8 uppercase border-b border-gray-100 pb-4">{t('cart.summary')}</h2>
              
              <div className="max-h-96 overflow-y-auto mb-8 space-y-6 pr-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-50 border border-gray-100 flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-sm font-bold text-gray-900 truncate">{item.name}</h4>
                      <p className="text-[10px] text-gray-400 uppercase font-bold">{t('cart.items')}: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-8 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 uppercase tracking-widest font-bold">{t('cart.subtotal')}</span>
                  <span className="font-bold">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 uppercase tracking-widest font-bold">{t('cart.shipping')}</span>
                  <span className="font-bold text-green-600 uppercase tracking-widest">{t('checkout.free')}</span>
                </div>
                <div className="flex justify-between items-end pt-4 border-t border-gray-50">
                  <span className="text-lg font-bold uppercase tracking-widest">{t('cart.total')}</span>
                  <span className="text-3xl font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-12 space-y-6">
                <div className="flex items-center space-x-4 text-gray-500">
                  <Truck className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('checkout.shipping_type')}</span>
                </div>
                <div className="flex items-center space-x-4 text-gray-500">
                  <ShieldCheck className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t('checkout.secure')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
