import { Product } from '../types';

export const products: Product[] = [
  {
    "id": "prod-001",
    "name": "TABLERO DE CONTROL DE BOMBAS UNIVERSAL",
    "price": 850,
    "category": "Tableros de Control",
    "image": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Voltaje": "380V Trifásico",
      "Protección": "IP65 Estanco",
      "Compatibilidad": "Bombas hasta 10 HP"
    },
    "description": "Tablero de comando y control universal para sistemas de bombeo industrial. Cuenta con protección térmica, guardamotor, testigo de fase, alarmas de nivel y relés de conmutación automática de alta fiabilidad.",
    "smartReady": true,
    "stock": 10
  },
  {
    "id": "prod-002",
    "name": "REGULADOR DE TENSION PORTATIL",
    "price": 310,
    "category": "Reguladores",
    "image": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Potencia": "2000 VA",
      "Rango entrada": "160V - 260V AC",
      "Filtro": "Ruido RFI/EMI integrado"
    },
    "description": "Estabilizador y regulador de tensión ligero y portátil. Indispensable para trabajos técnicos en campo, laboratorios móviles o protección temporal de instrumental electrónico delicado.",
    "smartReady": false,
    "stock": 18
  },
  {
    "id": "prod-003",
    "name": "CONSOLA DE MONITOREO DE FUGAS",
    "price": 1450,
    "category": "Sistemas de Seguridad",
    "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Sensores max": "8 sensores",
      "Alarmas": "Visual / Sonora / Relevador",
      "Pantalla": "LCD Gráfica 128x64"
    },
    "description": "Consola inteligente de monitoreo continuo para prevención de derrames y fugas. Permite conexión de sensores de hidrocarburos, vapores y agua en cámaras de contención o pozos intersticiales.",
    "smartReady": true,
    "stock": 5
  },
  {
    "id": "prod-004",
    "name": "CONSOLA DE TELEMEDICION DE COMBUSTIBLE",
    "price": 2200,
    "category": "Sistemas de Seguridad",
    "image": "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Tanques max": "6 tanques",
      "Protocolo": "Modbus RTU / TCP",
      "Precisión Vol": "± 0.1 mm"
    },
    "description": "Consola de telemetría de última generación para tanques de combustible. Monitoreo instantáneo de volumen, altura de producto, presencia de agua, temperatura media y alarmas de sobrellenado.",
    "smartReady": true,
    "stock": 7
  },
  {
    "id": "prod-005",
    "name": "CONTROLADOR DE SURTIDORES",
    "price": 1150,
    "category": "Control de Despacho",
    "image": "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Mangueras": "Hasta 16 concurrentes",
      "Comunicación": "Loop de Corriente / RS-485",
      "Interfaz": "Web Config Integrada"
    },
    "description": "Controlador electrónico para la automatización y fiscalización de despachos de combustibles. Enlaza sus surtidores directamente con el sistema administrativo o de facturación de la planta.",
    "smartReady": true,
    "stock": 12
  },
  {
    "id": "prod-006",
    "name": "SISTEMA DE CONTROL DE FLOTAS",
    "price": 2600,
    "category": "Control de Despacho",
    "image": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Tecnología": "RFID / NFC / Código QR",
      "Usuarios": "Ilimitados",
      "Red": "Ethernet / 4G LTE"
    },
    "description": "Sistema de gestión logística y despacho corporativo. Permite identificar choferes y vehículos por tarjeta magnética RFID, restringir cupos diarios de combustible y subir reportes automáticos en la nube.",
    "smartReady": true,
    "stock": 4
  },
  {
    "id": "prod-007",
    "name": "CABEZAL ELECTRONICO (AFORADOR)",
    "price": 750,
    "category": "Dispositivos de Medida",
    "image": "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Display": "LCD 6 dígitos de alto contraste",
      "Clasificación": "Apto intemperie (Ex d)",
      "Entrada": "Pulsador de alta resolución"
    },
    "description": "Cabezal de conteo electrónico para aforadores y caudalímetros de fluidos industriales. Registra de manera inmune al ruido los litros despachados con calibración decimal electrónica.",
    "smartReady": true,
    "stock": 15
  },
  {
    "id": "prod-008",
    "name": "SENSORES DE FUGAF DE VAPOR",
    "price": 180,
    "category": "Sensores",
    "image": "https://images.unsplash.com/photo-1532187863486-abf9d39d66e8?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Gas detectado": "Vapores de Hidrocarburos",
      "Señal": "Contacto Seco / 4-20mA",
      "Material": "Cobre niquelado"
    },
    "description": "Sensores intrínsecamente seguros para detección de fugas de vapor en cámaras intersticiales o pozos de monitoreo en estaciones de servicio y depósitos de fluidos combustibles.",
    "smartReady": true,
    "stock": 35
  },
  {
    "id": "prod-009",
    "name": "SENSOR DE PERDIDA NO DISCRIMINANTE",
    "price": 220,
    "category": "Sensores",
    "image": "https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Sensibilidad": "Cualquier líquido (conductivo/no)",
      "Dimensiones": "Compacto para cañería",
      "Alimentación": "5V - 12V DC"
    },
    "description": "Sensor puntual de rebose o pérdida diseñado para bandejas de derrame subterráneas. Detecta la presencia física de líquidos (agua, gasoil o nafta) de manera no selectiva.",
    "smartReady": false,
    "stock": 28
  },
  {
    "id": "prod-010",
    "name": "SONDA FLEXIBLE DE TELEMEDICION",
    "price": 1100,
    "category": "Sondas de Medida",
    "image": "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Longitud": "Hasta 12 metros",
      "Precisión": "± 1 mm",
      "Tipo": "Magnetostrictivo"
    },
    "description": "Sonda de nivel ultra-precisa flexible para tanques de combustible de gran porte o reservorios químicos elevados. Permite transporte enrollado reduciendo costos logísticos de instalación.",
    "smartReady": true,
    "stock": 9
  },
  {
    "id": "prod-011",
    "name": "SONDA RIGIDA DE TELEMEDICION",
    "price": 850,
    "category": "Sondas de Medida",
    "image": "https://images.unsplash.com/photo-1581092335397-9583eb92d232?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Rango": "1.5m a 4.0m",
      "Flotadores": "Doble (Producto + Agua)",
      "Resolución": "0.1 mm"
    },
    "description": "Sonda magnetostrictiva vertical rígida de acero inoxidable. Diseñada especialmente para tanques de doble pared enterrados (estaciones de servicio de servicio público y plantas industriales).",
    "smartReady": true,
    "stock": 14
  },
  {
    "id": "prod-012",
    "name": "SENSOR HIDRODASTATICO",
    "price": 280,
    "category": "Sensores",
    "image": "https://images.unsplash.com/photo-1608962714006-256260787430?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Rango bar": "0 a 2 Bar",
      "Conexión": "Sumergible IP68",
      "Precisión": "± 0.25% F.S."
    },
    "description": "Sensor de presión hidrostática apto para medición analógica de nivel en tanques cilíndricos, cisternas, aljibes o depósitos fluidos de fosa abierta. Excelente estabilidad térmica.",
    "smartReady": false,
    "stock": 20
  },
  {
    "id": "prod-013",
    "name": "TAPA DE 4\" CON PRENSACABLE",
    "price": 110,
    "category": "Accesorios de Tanque",
    "image": "https://images.unsplash.com/photo-1597423498214-000148c6254d?auto=format&fit=crop&q=80&w=600",
    "specs": {
      "Diámetro pozo": "4 pulgadas",
      "Salidas": "2 terminales prensacables",
      "Material": "Aluminio mecanizado CNC"
    },
    "description": "Tapa robusta de estanqueidad para boca de medición de tanques subterráneos de almacenamiento de hidrocarburos. Protege la sonda y contiene vapores con sellado mecánico seguro.",
    "smartReady": false,
    "stock": 55
  }
];
