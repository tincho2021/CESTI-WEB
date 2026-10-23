export const COMPANY = {
  name: 'C.E.S.T.I.',
  legal: 'Centro Estratégico de Soluciones Tecnológicas e Industriales',
  email: 'contacto@cesti.com.ar',
  phone: '+54 11 21 82 93 46',
  address: 'ROSALES 35, Ramos Mejía, Buenos Aires, Argentina',
  siteUrl: 'https://cesti-web.netlify.app',
};

function configuredSiteUrl(): string {
  const fromEnv = typeof import.meta !== 'undefined' ? String(import.meta.env?.VITE_PUBLIC_SITE_URL || '') : '';
  return (fromEnv || COMPANY.siteUrl).replace(/\/$/, '');
}

function isPublicHttpOrigin(origin: string): boolean {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    const host = url.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1' || host.endsWith('.local')) return false;
    if (/^(10|127|169\.254)\.\d+\.\d+\.\d+$/.test(host)) return false;
    if (/^192\.168\.\d+\.\d+$/.test(host)) return false;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

export function publicSiteOrigin(runtimeOrigin = ''): string {
  const runtime = runtimeOrigin.replace(/\/$/, '');
  if (isPublicHttpOrigin(runtime)) return runtime;
  return configuredSiteUrl();
}

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
