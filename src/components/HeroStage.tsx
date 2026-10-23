import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import HeroField from './HeroField';

const VIDEO_SRC = '/videos/portada.mp4';
const IMAGE_SRC = '/images/portada.jpeg';

const tanks = [
  { name: 'Nafta Súper', pct: 28, color: '#ef4444' },
  { name: 'V-Power Nafta', pct: 65, color: '#22c55e' },
  { name: 'Infinia Diesel', pct: 72, color: '#38bdf8' },
  { name: 'Nafta Súper', pct: 35, color: '#f97316' },
  { name: 'V-Power Nafta', pct: 58, color: '#22c55e' },
];

const HeroStage = () => {
  const { language } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const [clock, setClock] = useState(() => new Date());
  const [hasVideo, setHasVideo] = useState(false);
  const [ready, setReady] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [cursor, setCursor] = useState({ x: 72, y: 40 });
  const [levels, setLevels] = useState(tanks.map((tank) => tank.pct));
  const reduceMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = VIDEO_SRC;
    const markReady = () => setHasVideo(true);
    video.addEventListener('loadeddata', markReady);
    video.addEventListener('error', () => setHasVideo(false));
    return () => {
      video.removeEventListener('loadeddata', markReady);
      video.src = '';
    };
  }, []);

  useEffect(() => {
    const boot = window.setTimeout(() => setReady(true), reduceMotion ? 0 : 700);
    return () => window.clearTimeout(boot);
  }, [reduceMotion]);

  useEffect(() => {
    const tick = window.setInterval(() => setClock(new Date()), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const drift = window.setInterval(() => {
      setLevels((current) =>
        current.map((value, index) => {
          const next = value + Math.sin(Date.now() / 1200 + index) * 0.28;
          return Math.min(94, Math.max(16, next));
        }),
      );
    }, 700);
    return () => window.clearInterval(drift);
  }, []);

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const bounds = rootRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    setCursor({ x: x * 100, y: y * 100 });
    setTilt({
      x: (x - 0.5) * 2,
      y: (y - 0.5) * 2,
    });
  };

  const timestamp = clock.toLocaleString(language === 'es' ? 'es-AR' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      className={`hero-stage absolute inset-0 overflow-hidden bg-[#05070c] ${ready ? 'is-live' : 'is-booting'}`}
    >
      {!reduceMotion && <HeroField tilt={tilt} />}

      <div
        className="hero-cursor"
        style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
      />

      <div className="hero-boot-scan" />
      <div className="hero-vignette" />

      <motion.div
        className="hero-console"
        initial={{ opacity: 0, y: 80, rotateY: -28, scale: 0.88 }}
        animate={{ opacity: 1, y: 0, rotateY: -16 + tilt.x * 7, rotateX: 8 - tilt.y * 6, scale: 1 }}
        transition={{ duration: 1.15, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="hero-console-inner">
          {hasVideo ? (
            <video
              className="hero-media"
              src={VIDEO_SRC}
              autoPlay
              muted
              loop
              playsInline
              poster={IMAGE_SRC}
            />
          ) : (
            <img
              src={IMAGE_SRC}
              alt="Consola C.E.S.T.I. de telemedición"
              className="hero-media"
            />
          )}
          <div className="hero-console-scan" />
          <div className="hero-console-glow" />
        </div>
        <div className="hero-console-reflection" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85 }}
        className="absolute top-8 right-6 z-20 hidden md:flex items-center gap-3 rounded-full border border-cyan-300/20 bg-black/50 px-4 py-2 backdrop-blur-md"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-70" />
          <span className="relative h-2.5 w-2.5 rounded-full bg-red-500" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white">
          {language === 'es' ? 'Sistema online' : 'System online'}
        </span>
        <span className="font-mono text-[10px] text-cyan-200/80">{timestamp}</span>
      </motion.div>

      <motion.aside
        className="hero-hud hidden lg:block"
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300">
            {language === 'es' ? 'Telemedición en vivo' : 'Live telemetry'}
          </p>
          <p className="font-mono text-[10px] text-emerald-400">8ms</p>
        </div>
        <div className="space-y-2.5">
          {tanks.map((tank, index) => (
            <div key={`${tank.name}-${index}`}>
              <div className="mb-1 flex items-center justify-between text-[10px]">
                <span className="text-white/80">T{index + 1} {tank.name}</span>
                <span className="font-mono text-white">{levels[index].toFixed(1)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${levels[index]}%`, background: tank.color, boxShadow: `0 0 12px ${tank.color}` }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.aside>
    </div>
  );
};

export default HeroStage;
