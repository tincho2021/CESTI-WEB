import type { ReactNode } from 'react';
import { HOSES, isHose, type HoseId, type NodeId, type Phase } from './model';

type Props = {
  selected: NodeId | null;
  emphasis: NodeId[] | null;
  phase: Phase;
  linked: boolean;
  onChoose: (id: NodeId | null) => void;
};

const HOSE_LABEL: Record<HoseId, string> = { m1: 'M1', m2: 'M2', m3: 'M3', m4: 'M4' };

function nodeClass(hot: boolean, compatible: boolean, dim: boolean) {
  const ring = hot
    ? 'border-amber-500 ring-2 ring-amber-300'
    : compatible
      ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300'
      : 'border-slate-200 bg-white';
  return `flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left shadow-sm transition ${ring} ${dim ? 'opacity-40' : ''}`;
}

function NodeButton({
  title,
  detail,
  status,
  statusTone,
  hot,
  compatible,
  dim,
  onClick,
  children,
}: {
  title: string;
  detail: string;
  status: string;
  statusTone: string;
  hot: boolean;
  compatible: boolean;
  dim: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} className={nodeClass(hot, compatible, dim)}>
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-slate-50">{children}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-900">{title}</span>
        <span className="block text-xs leading-snug text-slate-500">{detail}</span>
      </span>
      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${statusTone}`}>{status}</span>
    </button>
  );
}

function TankIcon() {
  return (
    <svg viewBox="0 0 64 40" className="h-10 w-12">
      <ellipse cx="14" cy="20" rx="8" ry="12" fill="#1f8a48" />
      <rect x="12" y="8" width="34" height="24" fill="#1f8a48" />
      <ellipse cx="46" cy="20" rx="8" ry="12" fill="#187a3e" />
      <path d="M12 20h34v8c0 4-6 6-17 6s-17-2-17-6z" fill="#e39b3c" />
      <rect x="28" y="2" width="8" height="8" rx="1" fill="#e6b423" />
    </svg>
  );
}

function ProbeIcon() {
  return (
    <svg viewBox="0 0 64 40" className="h-10 w-12">
      <rect x="28" y="4" width="8" height="8" rx="1" fill="#d5dbe3" />
      <rect x="30" y="12" width="4" height="22" fill="#94a3b8" />
      <rect x="26" y="24" width="12" height="5" rx="2" fill="#111827" />
      <circle cx="32" cy="6" r="2" fill="#f59e0b" />
    </svg>
  );
}

function ConsoleIcon() {
  return (
    <svg viewBox="0 0 64 40" className="h-10 w-12">
      <rect x="24" y="16" width="16" height="18" rx="1" fill="#0f172a" />
      <rect x="18" y="6" width="28" height="16" rx="2" fill="#1e293b" />
      <rect x="21" y="9" width="22" height="10" rx="1" fill="#0b1220" />
      <rect x="23" y="12" width="12" height="3" fill="#e8a317" />
    </svg>
  );
}

function OfficeIcon() {
  return (
    <svg viewBox="0 0 64 40" className="h-10 w-12">
      <path d="M8 20 L32 6 L56 20 V36 H8 Z" fill="#f8fafc" stroke="#94a3b8" />
      <rect x="18" y="22" width="8" height="8" fill="#b9d4e4" />
      <rect x="38" y="22" width="8" height="14" fill="#1f2937" />
    </svg>
  );
}

function DispenserIcon() {
  return (
    <svg viewBox="0 0 64 40" className="h-10 w-12">
      <rect x="22" y="6" width="20" height="28" rx="2" fill="#f8fafc" stroke="#011832" />
      <path d="M42 12c6 2 8 8 4 12" fill="none" stroke="#1c1917" strokeWidth="2" />
      <path d="M22 12c-6 2-8 8-4 12" fill="none" stroke="#1c1917" strokeWidth="2" />
      <rect x="26" y="10" width="12" height="6" fill="#07111d" />
    </svg>
  );
}

export default function TechnicalView({ selected, emphasis, phase, linked, onChoose }: Props) {
  const dim = (id: NodeId) => emphasis !== null && !emphasis.includes(id);
  const hot = (id: NodeId) => selected === id;
  const hoseSelected = selected && isHose(selected) ? selected : null;
  const linkLabel = linked ? 'Telemedición' : phase === 'target' || phase === 'confirm' ? 'Destino compatible' : 'Sin enlace';
  const linkColor = linked ? 'bg-amber-500' : phase === 'target' || phase === 'confirm' ? 'bg-emerald-500' : 'bg-slate-300';
  const detail = describe(selected, linked);

  return (
    <aside className="flex h-full min-h-[520px] flex-col bg-[#f6f7f9] text-slate-900">
      <header className="border-b border-slate-200 px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">Vista técnica</p>
        <h2 className="mt-1 text-lg font-semibold tracking-tight">Los mismos cinco equipos</h2>
      </header>
      <div className="min-h-0 flex-1 space-y-6 overflow-auto px-5 py-5">
        <section>
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Combustible</h3>
          <div className="space-y-3">
            <NodeButton
              title="Tanque T1"
              detail="Subterráneo, en corte. Gasoil visible."
              status="Instalado"
              statusTone="bg-slate-100 text-slate-600"
              hot={hot('tank')}
              compatible={false}
              dim={dim('tank')}
              onClick={() => onChoose('tank')}
            >
              <TankIcon />
            </NodeButton>
            <p className="px-1 text-xs leading-relaxed text-slate-500">
              Las cañerías azules del corte muestran cómo se vería el producto. Esta demostración no asigna un tanque de origen.
            </p>
            <NodeButton
              title="Surtidor S1"
              detail="Cuatro mangueras dibujadas en el equipo."
              status="4 picos"
              statusTone="bg-slate-100 text-slate-600"
              hot={hot('dispenser')}
              compatible={false}
              dim={dim('dispenser')}
              onClick={() => onChoose('dispenser')}
            >
              <DispenserIcon />
            </NodeButton>
            <div className="grid grid-cols-4 gap-2">
              {HOSES.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChoose(id)}
                  className={`rounded-xl border px-2 py-3 text-sm font-semibold ${
                    hoseSelected === id ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-300' : 'border-slate-200 bg-white text-slate-800'
                  } ${dim(id) ? 'opacity-40' : ''}`}
                >
                  {HOSE_LABEL[id]}
                </button>
              ))}
            </div>
          </div>
        </section>
        <section>
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Comunicaciones</h3>
          <div className="space-y-0">
            <NodeButton
              title="Sonda T1"
              detail="Instalada en el cabezal del tanque."
              status={linked ? 'Conectada' : 'Sin enlace'}
              statusTone={linked ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}
              hot={hot('probe') || phase === 'origin'}
              compatible={false}
              dim={dim('probe')}
              onClick={() => onChoose('probe')}
            >
              <ProbeIcon />
            </NodeButton>
            <div className="relative mx-8 my-1 h-16">
              <div className={`absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 ${linkColor}`} />
              {linked && <span className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-amber-200 shadow" style={{ animation: 'cesti-travel 1.8s linear infinite' }} />}
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-[#f6f7f9] px-2 text-[11px] font-semibold text-slate-600">
                {linkLabel}
              </span>
            </div>
            <NodeButton
              title="Consola C1"
              detail="Destino de la telemedición de esta sonda."
              status={linked ? 'Con sonda' : phase === 'target' || phase === 'confirm' ? 'Compatible' : 'Libre'}
              statusTone={linked ? 'bg-emerald-100 text-emerald-800' : phase === 'target' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}
              hot={hot('console')}
              compatible={phase === 'target' || phase === 'confirm'}
              dim={dim('console')}
              onClick={() => onChoose('console')}
            >
              <ConsoleIcon />
            </NodeButton>
            <div className="h-4" />
            <NodeButton
              title="Oficina"
              detail="Sala de control. Sin enlace en esta demostración."
              status="Sala"
              statusTone="bg-slate-100 text-slate-600"
              hot={hot('office')}
              compatible={false}
              dim={dim('office')}
              onClick={() => onChoose('office')}
            >
              <OfficeIcon />
            </NodeButton>
          </div>
        </section>
      </div>
      <footer className="border-t border-slate-200 bg-white px-5 py-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{detail.kicker}</p>
        <p className="mt-1 text-sm font-semibold text-slate-900">{detail.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{detail.body}</p>
      </footer>
      <style>{`@keyframes cesti-travel { from { top: 0 } to { top: calc(100% - 10px) } }`}</style>
    </aside>
  );
}

function describe(selected: NodeId | null, linked: boolean) {
  if (selected === 'tank') {
    return {
      kicker: 'Tanque',
      title: 'T1 · Gasoil',
      body: 'El corte muestra el combustible y la sonda adentro. El estado de telemedición se confirma recién cuando la sonda queda unida a la consola.',
    };
  }
  if (selected === 'probe') {
    return {
      kicker: 'Sonda',
      title: linked ? 'Telemedición configurada' : 'Sonda instalada',
      body: linked
        ? 'El enlace llega a la consola C1. Es una conexión de la demostración, no una comunicación en vivo con el equipo.'
        : 'Entrá por Conectar y elegí la consola. No hace falta elegir un protocolo.',
    };
  }
  if (selected === 'console') {
    return {
      kicker: 'Consola',
      title: 'C1',
      body: linked ? 'Supervisa la sonda de T1.' : 'Todavía no tiene una sonda asignada.',
    };
  }
  if (selected === 'dispenser') {
    return {
      kicker: 'Surtidor',
      title: 'S1 · cuatro mangueras',
      body: 'M1 y M2 están del lado visible. M3 y M4, del lado opuesto. Ninguna tiene tanque de origen en esta demostración.',
    };
  }
  if (selected && isHose(selected)) {
    return {
      kicker: `Manguera ${HOSE_LABEL[selected]}`,
      title: 'Dibujada en el surtidor',
      body: 'Producto visible en el tanque: gasoil. Tanque de origen: sin asignar.',
    };
  }
  if (selected === 'office') {
    return {
      kicker: 'Oficina',
      title: 'Sala de control',
      body: 'Está en la playa para ubicar la consola. No forma parte del enlace de la sonda.',
    };
  }
  return {
    kicker: 'Escenario',
    title: 'Cinco equipos, un enlace pendiente',
    body: 'Elegí un equipo en cualquiera de las dos vistas. Conectar une la sonda con la consola.',
  };
}
