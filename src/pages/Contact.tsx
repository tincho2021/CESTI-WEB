import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Contact = () => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('https://formsubmit.co/ajax/martinrodriguezmelgarejo@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          message: formData.message,
          _subject: `Nuevo mensaje de ${formData.name} - CESTI`
        })
      });

      if (response.ok) {
        setIsSuccess(true);
        setFormData({ name: '', email: '', message: '' });
      } else {
        // Fallback to mailto if API fails
        const subject = encodeURIComponent(`Nuevo mensaje de ${formData.name}`);
        const body = encodeURIComponent(`Nombre: ${formData.name}\nEmail: ${formData.email}\n\nMensaje:\n${formData.message}`);
        window.location.href = `mailto:martinrodriguezmelgarejo@gmail.com?subject=${subject}&body=${body}`;
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      // Fallback to mailto on network error
      const subject = encodeURIComponent(`Nuevo mensaje de ${formData.name}`);
      const body = encodeURIComponent(`Nombre: ${formData.name}\nEmail: ${formData.email}\n\nMensaje:\n${formData.message}`);
      window.location.href = `mailto:martinrodriguezmelgarejo@gmail.com?subject=${subject}&body=${body}`;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-32 pb-20 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-12 h-[2px] bg-red-600" />
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-600">{t('nav.contact')}</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter text-gray-900 mb-8 uppercase">
              {t('contact.title')}
            </h1>
            <p className="text-xl text-gray-600 mb-12 leading-relaxed">
              {t('contact.sub')}
            </p>

            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-white border border-gray-100 flex items-center justify-center rounded-sm shadow-sm">
                  <Phone className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">{t('contact.whatsapp')}</p>
                  <p className="text-lg font-bold text-gray-900">+54 11 21 82 93 46</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-white border border-gray-100 flex items-center justify-center rounded-sm shadow-sm">
                  <Mail className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">{t('contact.email_us')}</p>
                  <p className="text-lg font-bold text-gray-900">martinrodriguezmelgarejo@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="w-12 h-12 bg-white border border-gray-100 flex items-center justify-center rounded-sm shadow-sm">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1">{t('contact.location')}</p>
                  <a 
                    href="https://www.google.com/maps?q=Rosales+35,+Ramos+Mejia,+Buenos+Aires,+Argentina" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-lg font-bold text-gray-900 hover:text-red-600 transition-colors"
                  >
                    {t('contact.address_val')}
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="bg-white p-10 border border-gray-100 shadow-xl rounded-sm"
          >
            {isSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
                <h3 className="text-2xl font-bold mb-4">{t('contact.success')}</h3>
                <button 
                  onClick={() => setIsSuccess(false)}
                  className="text-red-600 font-bold uppercase tracking-widest text-xs hover:underline"
                >
                  {t('contact.send')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">
                    {t('contact.name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 px-4 py-4 focus:border-red-600 outline-none transition-colors font-medium"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">
                    {t('contact.email')}
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 px-4 py-4 focus:border-red-600 outline-none transition-colors font-medium"
                    placeholder="john@company.com"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">
                    {t('contact.message')}
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-100 px-4 py-4 focus:border-red-600 outline-none transition-colors font-medium resize-none"
                    placeholder={t('contact.message')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-5 font-bold uppercase tracking-widest text-sm hover:bg-red-600 transition-all flex items-center justify-center group disabled:opacity-50"
                >
                  {isSubmitting ? t('contact.sending') : t('contact.send')}
                  <Send className="ml-2 w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Location Section */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mt-32"
        >
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-12 h-[2px] bg-red-600" />
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-red-600">{t('contact.location')}</span>
          </div>
          <h2 className="text-4xl font-bold tracking-tighter text-gray-900 mb-12 uppercase">
            {t('contact.location')}
          </h2>
          
          <div className="bg-white border border-gray-100 p-4 shadow-xl rounded-sm overflow-hidden">
            <iframe 
              src="https://www.google.com/maps?q=Rosales+35,+Ramos+Mejia,+Buenos+Aires,+Argentina&output=embed"
              width="100%" 
              height="450" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="grayscale hover:grayscale-0 transition-all duration-700"
            ></iframe>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
