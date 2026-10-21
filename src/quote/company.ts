export const COMPANY = {
  name: 'C.E.S.T.I.',
  legal: 'Centro Estratégico de Soluciones Tecnológicas e Industriales',
  email: 'contacto@cesti.com.ar',
  phone: '+54 11 21 82 93 46',
  address: 'ROSALES 35, Ramos Mejía, Buenos Aires, Argentina',
};

export function installationLabel(type: string | null | undefined): string {
  switch (type) {
    case 'station':
      return 'Estación de servicio';
    case 'agro':
      return 'Instalación agropecuaria';
    case 'fleet':
      return 'Flota de vehículos';
    case 'blank':
      return 'Proyecto desde cero';
    default:
      return 'Sin plantilla';
  }
}
