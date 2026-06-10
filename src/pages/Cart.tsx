import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, ArrowRight, ShoppingBag, Minus, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();
  const { t } = useLanguage();

  if (cart.length === 0) {
    return (
      <div className="pt-40 pb-20 text-center min-h-[70vh]">
        <div className="max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="text-3xl font-bold tracking-tighter text-gray-900 mb-4 uppercase">{t('cart.empty')}</h2>
          <p className="text-gray-500 mb-10 leading-relaxed">{t('cart.empty_desc')}</p>
          <Link
            to="/shop"
            className="bg-black text-white px-10 py-5 font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-all inline-block"
          >
            {t('cart.start')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-5xl font-bold tracking-tighter text-gray-900 mb-12 uppercase">{t('cart.title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cart.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 p-6 flex flex-col sm:flex-row items-center gap-8"
              >
                <div className="w-32 h-32 bg-gray-50 border border-gray-100 flex-shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover grayscale"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="flex-grow text-center sm:text-left">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1 block">
                    {item.category}
                  </span>
                  <Link to={`/product/${item.id}`}>
                    <h3 className="text-xl font-bold tracking-tight text-gray-900 hover:text-red-600 transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">${item.price} {t('cart.per_unit')}</p>
                </div>

                <div className="flex items-center border border-gray-200">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 text-center font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-gray-100 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-right min-w-[100px]">
                  <p className="text-xl font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors mt-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-100 p-8 sticky top-32">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 mb-8 uppercase border-b border-gray-100 pb-4">{t('cart.summary')}</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 uppercase tracking-widest font-bold">{t('cart.subtotal')} ({totalItems} {t('cart.items')})</span>
                  <span className="font-bold">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 uppercase tracking-widest font-bold">{t('cart.shipping')}</span>
                  <span className="text-green-600 font-bold uppercase tracking-widest">{t('cart.shipping_calc')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 uppercase tracking-widest font-bold">{t('cart.tax')}</span>
                  <span className="font-bold">$0.00</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 mb-10">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-bold uppercase tracking-widest">{t('cart.total')}</span>
                  <span className="text-3xl font-bold text-gray-900">${totalPrice.toFixed(2)}</span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full bg-black text-white py-5 font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-all flex items-center justify-center group"
              >
                {t('cart.checkout')}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-center space-x-6 grayscale opacity-50">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" referrerPolicy="no-referrer" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" referrerPolicy="no-referrer" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" referrerPolicy="no-referrer" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
