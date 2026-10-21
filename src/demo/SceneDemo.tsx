import { useEffect, useMemo, useState } from 'react';
import PhysicalView from './PhysicalView';
import TechnicalView from './TechnicalView';
import { isHose, type Focus, type NodeId, type Phase } from './model';

function emphasisFor(selected: NodeId | null, phase: Phase, linked: boolean): NodeId[] | null {
  if (phase === 'origin') return ['tank', 'probe'];
  if (phase === 'target' || phase === 'confirm') return ['tank', 'probe', 'console'];
  if (!selected) return null;
  if (selected === 'tank' || selected === 'probe') return linked ? ['tank', 'probe', 'console'] : ['tank', 'probe'];
  if (selected === 'console') return linked ? ['tank', 'probe', 'console'] : ['console'];
  if (selected === 'dispenser' || isHose(selected)) return ['dispenser', 'm1', 'm2', 'm3', 'm4'];
  return ['office'];
}

export default function SceneDemo() {
  const [selected, setSelected] = useState<NodeId | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [linked, setLinked] = useState(false);
  const [focus, setFocus] = useState<Focus>('all');
  const [hint, setHint] = useState<string | null>(null);
  const emphasis = useMemo(() => emphasisFor(selected, phase, linked), [selected, phase, linked]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPhase('idle');
        setHint(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function choose(id: NodeId | null) {
    if (phase === 'confirm') return;
    if (phase === 'idle') {
      setSelected(id);
      setHint(null);
      if (id === 'tank' || id === 'probe') setFocus('tank');
      else if (id === 'dispenser' || (id !== null && isHose(id))) setFocus('dispenser');
      else if (id === 'console') setFocus('console');
      else if (id === null) setFocus('all');
      return;
    }
    if (id === null) {
      setHint(phase === 'origin' ? 'Elegí la sonda del tanque.' : 'Elegí la consola.');
      return;
    }
    const origin = id === 'probe' || id === 'tank';
    if (phase === 'origin') {
      if (!origin) {
        setHint('Empezá por la sonda del tanque.');
        return;
      }
      setSelected('probe');
      setPhase('target');
      setFocus('all');
      setHint(null);
      return;
    }
    if (id === 'console') {
      setSelected('console');
      setPhase('confirm');
      setFocus('all');
      setHint(null);
      return;
    }
    if (origin) {
      setSelected('probe');
      return;
    }
    setHint('Ese equipo no recibe esta sonda. La consola sí.');
  }

  function confirm() {
    setLinked(true);
    setPhase('idle');
    setSelected('probe');
    setFocus('all');
    setHint('Listo. La sonda quedó unida a la consola en las dos vistas.');
  }

  function cancel() {
    setPhase('idle');
    setSelected('probe');
    setHint(null);
  }

  const step =
    phase === 'origin'
      ? 'Elegí el equipo que querés conectar.'
      : phase === 'target'
        ? 'Ahora elegí dónde conectarlo.'
        : phase === 'confirm'
          ? 'Revisá el enlace antes de confirmar.'
          : hint ?? 'La sonda ya está en el tanque. Falta unirla a la consola.';

  return (
    <div className="fixed inset-x-0 bottom-0 top-20 z-10 flex flex-col bg-[#d7e0e8] text-slate-900">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur">
        <div className="mr-auto min-w-[220px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Demostración visual</p>
          <p className="text-sm text-slate-600">No modifica la cotización ni el catálogo.</p>
        </div>
        <p className="max-w-md text-sm font-medium text-slate-800">{step}</p>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => { setPhase('origin'); setSelected('probe'); setFocus('tank'); setHint(null); }} className="rounded-full bg-[#011832] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
            Conectar
          </button>
          {linked && phase === 'idle' && (
            <button type="button" onClick={() => { setLinked(false); setHint('Se quitó el enlace de la demostración.'); }} className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
              Quitar enlace
            </button>
          )}
          {(['all', 'tank', 'dispenser', 'console'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFocus(item)}
              className={`rounded-full px-3 py-2 text-xs font-semibold ${focus === item ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'}`}
            >
              {item === 'all' ? 'General' : item === 'tank' ? 'Tanque' : item === 'dispenser' ? 'Surtidor' : 'Consola'}
            </button>
          ))}
        </div>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-auto lg:grid-cols-[minmax(0,1.45fr)_minmax(340px,420px)] lg:overflow-hidden">
        <div className="relative min-h-[560px] lg:min-h-0">
          <div className="absolute inset-0">
            <PhysicalView selected={selected} emphasis={emphasis} phase={phase} linked={linked} focus={focus} onChoose={choose} />
          </div>
          <div className="pointer-events-none absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 shadow-sm">
            Instalación física
          </div>
        </div>
        <TechnicalView selected={selected} emphasis={emphasis} phase={phase} linked={linked} onChoose={choose} />
      </div>
      {phase === 'confirm' && (
        <div className="absolute bottom-6 left-1/2 z-20 w-[min(420px,calc(100%-2rem))] -translate-x-1/2 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-slate-200 lg:left-[32%]">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Confirmar conexión</p>
          <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-slate-500">Origen</dt>
            <dd className="font-semibold">Sonda T1</dd>
            <dt className="text-slate-500">Destino</dt>
            <dd className="font-semibold">Consola C1</dd>
            <dt className="text-slate-500">Tipo</dt>
            <dd className="font-semibold">Telemedición</dd>
            <dt className="text-slate-500">Estado</dt>
            <dd className="font-semibold text-emerald-700">Compatible</dd>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-slate-500">Este enlace existe solo en la demostración. No indica comunicación con hardware.</p>
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={confirm} className="rounded-full bg-[#011832] px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">Conectar</button>
            <button type="button" onClick={cancel} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
