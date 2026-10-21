import * as THREE from 'three';

function canvas(width: number, height: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void) {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  const ctx = element.getContext('2d');
  if (!ctx) throw new Error('No se pudo crear la textura de la demostración.');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(element);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, count: number, color: string, size: number) {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i += 1) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    ctx.fillRect(x, y, Math.random() * size + 0.4, Math.random() * size * 0.6 + 0.3);
  }
}

export function soilTexture() {
  return canvas(512, 512, (ctx, w, h) => {
    const bands = ['#5e5046', '#4e3c2e', '#3f3126', '#36281f', '#2e221b', '#261c16'];
    bands.forEach((color, index) => {
      ctx.fillStyle = color;
      ctx.fillRect(0, (h / bands.length) * index, w, h / bands.length + 1);
    });
    for (let y = 0; y < h; y += 18) {
      ctx.fillStyle = y % 36 === 0 ? 'rgba(255,248,240,0.05)' : 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, y, w, 2);
    }
    speckle(ctx, w, h, 700, 'rgba(30,22,16,0.35)', 2.4);
    speckle(ctx, w, h, 220, 'rgba(214,196,170,0.28)', 1.6);
    ctx.fillStyle = '#b7b1aa';
    ctx.fillRect(0, 0, w, 22);
    ctx.fillStyle = '#8d8276';
    ctx.fillRect(0, 22, w, 18);
    speckle(ctx, w, 64, 80, 'rgba(80,70,60,0.4)', 2);
  });
}

export function floorTexture() {
  const texture = canvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#4a3b2e';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 500, 'rgba(20,14,10,0.45)', 2.2);
    speckle(ctx, w, h, 180, 'rgba(160,140,110,0.25)', 1.4);
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 2);
  return texture;
}

export function concreteTexture() {
  const texture = canvas(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#c5cbcf';
    ctx.fillRect(0, 0, w, h);
    speckle(ctx, w, h, 400, 'rgba(90,96,102,0.18)', 1.8);
    speckle(ctx, w, h, 120, 'rgba(255,255,255,0.2)', 1.2);
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

export function cautionTexture() {
  const texture = canvas(128, 32, (ctx, w, h) => {
    ctx.fillStyle = '#f5c400';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#161616';
    for (let x = -h; x < w; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + 8, h);
      ctx.lineTo(x + 8 + h, 0);
      ctx.lineTo(x + h, 0);
      ctx.fill();
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.repeat.set(8, 1);
  return texture;
}

export function corrugation() {
  const texture = canvas(32, 128, (ctx, w, h) => {
    for (let y = 0; y < h; y += 1) {
      const wave = Math.sin((y / h) * Math.PI * 28) * 0.5 + 0.5;
      const shade = Math.round(30 + wave * 200);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(0, y, w, 1);
    }
  });
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 22);
  return texture;
}

export function fasciaTexture() {
  return canvas(512, 64, (ctx, w, h) => {
    ctx.fillStyle = '#011832';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, h - 8, w, 8);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('C.E.S.T.I.', w / 2, h / 2 - 2);
  });
}

export function consoleScreen(linked: boolean) {
  return canvas(512, 320, (ctx, w, h) => {
    ctx.fillStyle = '#0b1220';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, w - 36, h - 36);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText('TANQUE T1', 36, 58);
    ctx.fillStyle = '#e7edf5';
    ctx.font = '700 28px Inter, sans-serif';
    ctx.fillText('GASOIL', 36, 98);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(36, 130, 360, 28);
    ctx.fillStyle = '#e8a317';
    ctx.fillRect(36, 130, 220, 28);
    ctx.fillStyle = linked ? '#34d399' : '#fbbf24';
    ctx.beginPath();
    ctx.arc(w - 58, 52, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '500 18px Inter, sans-serif';
    ctx.fillText(linked ? 'ENLACE CONFIGURADO' : 'SONDA SIN ENLACE', 36, 200);
    ctx.fillStyle = '#64748b';
    ctx.font = '500 16px Inter, sans-serif';
    ctx.fillText('Sin telemetría en vivo', 36, 232);
  });
}

export function plateTexture(text: string) {
  return canvas(128, 64, (ctx, w, h) => {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#011832';
    ctx.fillRect(0, 0, 8, h);
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 34px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2 + 2, h / 2 + 1);
  });
}

export function pumpScreen() {
  return canvas(256, 128, (ctx, w, h) => {
    ctx.fillStyle = '#07111d';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d1fae5';
    ctx.font = '700 42px JetBrains Mono, monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillText('000.00', w - 16, h / 2 - 8);
    ctx.fillStyle = '#64748b';
    ctx.font = '600 14px Inter, sans-serif';
    ctx.fillText('LITROS', w - 16, h / 2 + 28);
  });
}
