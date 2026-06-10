import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'es';

interface Translations {
  [key: string]: {
    en: string;
    es: string;
  };
}

const translations: Translations = {
  // Navbar
  'nav.home': { en: 'Home', es: 'Inicio' },
  'nav.shop': { en: 'Shop', es: 'Tienda' },
  'nav.solutions': { en: 'Solutions', es: 'Soluciones' },
  'nav.smart': { en: 'Smart Systems', es: 'Sistemas Smart' },
  'nav.industrial': { en: 'Strategic Center for Technological & Industrial Solutions', es: 'Centro Estratégico de Soluciones Tecnológicas e Industriales' },
  
  // Hero
  'hero.tag': { en: 'Precision Engineering', es: 'Ingeniería de Precisión' },
  'hero.title.part1': { en: 'Smart Industrial Solutions.', es: 'Soluciones Industriales Inteligentes.' },
  'hero.title.part2': { en: 'Engineered for Precision.', es: 'Diseñadas para la Precisión.' },
  'hero.sub': { en: 'From electrical panels to IoT monitoring systems — we design, integrate, and deliver intelligent industrial technology.', es: 'Desde tableros eléctricos hasta sistemas de monitoreo IoT: diseñamos, integramos y entregamos tecnología industrial inteligente.' },
  'hero.cta.shop': { en: 'Shop Products', es: 'Ver Productos' },
  'hero.cta.custom': { en: 'Request Custom Solution', es: 'Solicitar Solución a Medida' },
  
  // Stats
  'stat.uptime': { en: 'Uptime', es: 'Disponibilidad' },
  'stat.response': { en: 'Response', es: 'Respuesta' },
  'stat.security': { en: 'Security', es: 'Seguridad' },
  'stat.nodes': { en: 'Nodes', es: 'Nodos' },
  
  // Shop
  'shop.title': { en: 'Industrial Catalog', es: 'Catálogo Industrial' },
  'shop.sub': { en: 'High-performance components for modern industrial infrastructure. All products are tested for extreme reliability.', es: 'Componentes de alto rendimiento para infraestructura industrial moderna. Todos los productos son probados para una confiabilidad extrema.' },
  'shop.view_all': { en: 'View All Products', es: 'Ver Todos los Productos' },
  'shop.search': { en: 'Search components...', es: 'Buscar componentes...' },
  'shop.no_results': { en: 'No products found matching your criteria.', es: 'No se encontraron productos que coincidan con su búsqueda.' },
  'shop.clear': { en: 'Clear Filters', es: 'Limpiar Filtros' },
  
  // Product Card
  'product.smart_ready': { en: 'Smart Ready', es: 'Listo para Smart' },
  'product.add_to_cart': { en: 'Add to Cart', es: 'Añadir al Carrito' },
  
  // Product Detail
  'product.back': { en: 'Back', es: 'Volver' },
  'product.in_stock': { en: 'In Stock', es: 'En Stock' },
  'product.units': { en: 'units', es: 'unidades' },
  'product.download': { en: 'Download Datasheet (PDF)', es: 'Descargar Ficha Técnica (PDF)' },
  'product.warranty': { en: '2 Year Warranty', es: '2 Años de Garantía' },
  'product.shipping': { en: 'Worldwide Shipping', es: 'Envío Internacional' },
  'product.related': { en: 'Related Components', es: 'Componentes Relacionados' },
  
  // Smart Section
  'smart.tag': { en: 'IoT Ecosystem', es: 'Ecosistema IoT' },
  'smart.title': { en: 'From Hardware to', es: 'Del Hardware a los' },
  'smart.title.accent': { en: 'Intelligent Systems', es: 'Sistemas Inteligentes' },
  'smart.desc': { en: 'We bridge the gap between physical machinery and digital intelligence. Our systems provide real-time monitoring, predictive maintenance, and cloud-based control for industrial environments.', es: 'Cerramos la brecha entre la maquinaria física y la inteligencia digital. Nuestros sistemas proporcionan monitoreo en tiempo real, mantenimiento predictivo y control basado en la nube para entornos industriales.' },
  'smart.feat1.title': { en: 'Remote Monitoring', es: 'Monitoreo Remoto' },
  'smart.feat1.desc': { en: 'Real-time data from any device.', es: 'Datos en tiempo real desde cualquier dispositivo.' },
  'smart.feat2.title': { en: 'Cloud Dashboards', es: 'Tableros en la Nube' },
  'smart.feat2.desc': { en: 'Visual analytics for decision making.', es: 'Analítica visual para la toma de decisiones.' },
  'smart.feat3.title': { en: 'Modbus / RS-485', es: 'Modbus / RS-485' },
  'smart.feat3.desc': { en: 'Standard industrial protocols.', es: 'Protocolos industriales estándar.' },
  'smart.feat4.title': { en: 'Alarm Systems', es: 'Sistemas de Alarma' },
  'smart.feat4.desc': { en: 'Instant notifications on anomalies.', es: 'Notificaciones instantáneas ante anomalías.' },
  'smart.status': { en: 'Live System Status', es: 'Estado del Sistema en Vivo' },
  
  // Solutions
  'solutions.title': { en: 'Custom Engineering Solutions', es: 'Soluciones de Ingeniería a Medida' },
  'solutions.sub': { en: 'Beyond our standard catalog, we provide end-to-end engineering for complex industrial challenges.', es: 'Más allá de nuestro catálogo estándar, brindamos ingeniería de extremo a extremo para desafíos industriales complejos.' },
  'solutions.feat1.title': { en: 'Panel Design', es: 'Diseño de Tableros' },
  'solutions.feat1.desc': { en: 'Custom electrical and control panel design following international standards.', es: 'Diseño personalizado de tableros eléctricos y de control siguiendo estándares internacionales.' },
  'solutions.feat2.title': { en: 'Automation', es: 'Automatización' },
  'solutions.feat2.desc': { en: 'PLC programming and industrial automation for production lines.', es: 'Programación de PLC y automatización industrial para líneas de producción.' },
  'solutions.feat3.title': { en: 'Integration', es: 'Integración' },
  'solutions.feat3.desc': { en: 'Seamless integration of new technology into legacy industrial systems.', es: 'Integración fluida de nueva tecnología en sistemas industriales heredados.' },
  'solutions.learn_more': { en: 'Learn More', es: 'Saber Más' },
  'solutions.cta.title': { en: 'Have a specific project in mind?', es: '¿Tiene un proyecto específico en mente?' },
  'solutions.cta.sub': { en: 'Our engineering team is ready to help you design the perfect solution.', es: 'Nuestro equipo de ingeniería está listo para ayudarlo a diseñar la solución perfecta.' },
  'solutions.cta.btn': { en: 'Request a Quote', es: 'Solicitar Cotización' },
  
  // Cart
  'cart.title': { en: 'Your Order', es: 'Su Pedido' },
  'cart.empty': { en: 'Your cart is empty', es: 'Su carrito está vacío' },
  'cart.empty_desc': { en: "Looks like you haven't added any industrial components to your order yet.", es: 'Parece que aún no ha añadido componentes industriales a su pedido.' },
  'cart.start': { en: 'Start Shopping', es: 'Empezar a Comprar' },
  'cart.per_unit': { en: 'per unit', es: 'por unidad' },
  'cart.summary': { en: 'Order Summary', es: 'Resumen del Pedido' },
  'cart.subtotal': { en: 'Subtotal', es: 'Subtotal' },
  'cart.items': { en: 'items', es: 'artículos' },
  'cart.shipping': { en: 'Shipping', es: 'Envío' },
  'cart.shipping_calc': { en: 'Calculated at checkout', es: 'Calculado al finalizar' },
  'cart.tax': { en: 'Tax', es: 'Impuestos' },
  'cart.total': { en: 'Total', es: 'Total' },
  'cart.checkout': { en: 'Proceed to Checkout', es: 'Proceder al Pago' },
  
  // Checkout
  'checkout.title': { en: 'Checkout', es: 'Finalizar Compra' },
  'checkout.confirmed': { en: 'Order Confirmed', es: 'Pedido Confirmado' },
  'checkout.confirmed_desc': { en: 'Thank you for your purchase. Your industrial components are being prepared for shipment. A confirmation email has been sent to', es: 'Gracias por su compra. Sus componentes industriales están siendo preparados para el envío. Se ha enviado un correo de confirmación a' },
  'checkout.return': { en: 'Return to Dashboard', es: 'Volver al Inicio' },
  'checkout.no_items': { en: 'No items to checkout', es: 'No hay artículos para finalizar' },
  'checkout.back_cart': { en: 'Back to Cart', es: 'Volver al Carrito' },
  'checkout.contact': { en: 'Contact Information', es: 'Información de Contacto' },
  'checkout.shipping_details': { en: 'Shipping Details', es: 'Detalles de Envío' },
  'checkout.payment': { en: 'Payment Method', es: 'Método de Pago' },
  'checkout.email': { en: 'Email Address', es: 'Correo Electrónico' },
  'checkout.first_name': { en: 'First Name', es: 'Nombre' },
  'checkout.last_name': { en: 'Last Name', es: 'Apellido' },
  'checkout.address': { en: 'Shipping Address', es: 'Dirección de Envío' },
  'checkout.city': { en: 'City', es: 'Ciudad' },
  'checkout.zip': { en: 'Zip Code', es: 'Código Postal' },
  'checkout.card': { en: 'Credit Card', es: 'Tarjeta de Crédito' },
  'checkout.card_num': { en: 'Card Number', es: 'Número de Tarjeta' },
  'checkout.complete': { en: 'Complete Purchase', es: 'Completar Compra' },
  'checkout.processing': { en: 'Processing Transaction...', es: 'Procesando Transacción...' },
  'checkout.free': { en: 'Free', es: 'Gratis' },
  'checkout.shipping_type': { en: 'Express Industrial Shipping (2-4 Days)', es: 'Envío Industrial Express (2-4 Días)' },
  'checkout.secure': { en: 'Secure AES-256 Encrypted Transaction', es: 'Transacción Segura Encriptada AES-256' },
  
  // Footer
  'footer.desc': { en: 'Strategic Center for Technological and Industrial Solutions. Leading the future of industrial automation in Latin America.', es: 'Centro Estratégico de Soluciones Tecnológicas e Industriales. Liderando el futuro de la automatización industrial en América Latina.' },
  'footer.rights': { en: 'All rights reserved.', es: 'Todos los derechos reservados.' },
  'footer.privacy': { en: 'Privacy Policy', es: 'Política de Privacidad' },
  'footer.terms': { en: 'Terms of Service', es: 'Términos de Servicio' },
  
  // Contact
  'contact.title': { en: 'Contact Us', es: 'Contáctenos' },
  'contact.sub': { en: 'Have a project or need technical support? Our team is ready to assist you.', es: '¿Tiene un proyecto o necesita soporte técnico? Nuestro equipo está listo para ayudarlo.' },
  'contact.name': { en: 'Full Name', es: 'Nombre Completo' },
  'contact.email': { en: 'Email Address', es: 'Correo Electrónico' },
  'contact.message': { en: 'Message', es: 'Mensaje' },
  'contact.send': { en: 'Send Message', es: 'Enviar Mensaje' },
  'contact.sending': { en: 'Sending...', es: 'Enviando...' },
  'contact.success': { en: 'Message sent successfully!', es: '¡Mensaje enviado con éxito!' },
  'contact.info': { en: 'Contact Information', es: 'Información de Contacto' },
  'contact.whatsapp': { en: 'WhatsApp Support', es: 'Soporte por WhatsApp' },
  'contact.email_us': { en: 'Email Us', es: 'Envíenos un Correo' },
  'contact.location': { en: 'Location', es: 'Ubicación' },
  'contact.address': { en: 'Address', es: 'Dirección' },
  'contact.address_val': { en: 'ROSALES 35, Ramos Mejía, Buenos Aires, Argentina', es: 'ROSALES 35, Ramos Mejía, Buenos Aires, Argentina' },
  'nav.contact': { en: 'Contact', es: 'Contacto' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('es');

  const t = (key: string): string => {
    if (!translations[key]) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    return translations[key][language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
