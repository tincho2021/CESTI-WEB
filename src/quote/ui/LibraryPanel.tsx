import { useEffect, useRef } from 'react';
import { LIBRARY } from '../library';
import type { LibraryItem } from '../types';

function Thumb({ item }: { item: LibraryItem }) {
  const tone = item.category === 'infrastructure' ? '#64748b' : item.category === 'equipment' ? '#011832' : '#b91c1c';
  return (
    <svg viewBox="0 0 64 48" className="w-14 h-11 shrink-0 rounded-2xl bg-emerald-50" aria-hidden>
      {item.kind === 'tank-underground' && (
        <>
          <ellipse cx="32" cy="30" rx="22" ry="8" fill="#6b4a32" />
          <rect x="12" y="20" width="40" height="10" rx="5" fill="#f8fafc" stroke="#93c5fd" />
          <rect x="18" y="23" width="28" height="5" fill="#eab308" />
          <circle cx="24" cy="16" r="3" fill="#dc2626" />
          <circle cx="40" cy="16" r="3" fill="#f97316" />
        </>
      )}
      {item.kind === 'tank-vertical' && (
        <>
          <path d="M20 40 V16 H44 V40" fill="#f8fafc" stroke="#1d4ed8" />
          <path d="M18 16 L32 6 L46 16 Z" fill="#e2e8f0" />
          <rect x="46" y="18" width="8" height="5" fill="#1e3a8a" transform="rotate(-20 46 18)" />
        </>
      )}
      {(item.kind === 'dispenser' || item.kind === 'loading-point') && (
        <>
          <rect x="14" y="36" width="36" height="6" fill="#d6d3d1" />
          <rect x="26" y="14" width="12" height="22" fill="#f8fafc" stroke={tone} />
          <rect x="24" y="8" width="16" height="8" fill="#1d4ed8" />
          <path d="M38 22 C48 22 48 34 40 36" stroke="#2563eb" fill="none" strokeWidth="2" />
        </>
      )}
      {item.kind === 'fuel-pump' && (
        <>
          <rect x="14" y="34" width="36" height="6" fill="#44403c" />
          <circle cx="24" cy="24" r="8" fill="#f59e0b" />
          <rect x="32" y="16" width="10" height="16" fill="#b91c1c" />
          <rect x="8" y="22" width="10" height="4" fill="#1d4ed8" />
          <rect x="46" y="22" width="10" height="4" fill="#1d4ed8" />
        </>
      )}
      {item.kind === 'flow-meter' && (
        <>
          <rect x="8" y="22" width="48" height="6" fill="#94a3b8" />
          <circle cx="32" cy="20" r="8" fill="#0f172a" />
          <circle cx="32" cy="20" r="5" fill="#bfdbfe" />
        </>
      )}
      {item.kind === 'mechanical-meter' && (
        <>
          <rect x="10" y="26" width="44" height="6" fill="#94a3b8" />
          <rect x="18" y="12" width="28" height="16" fill="#f8fafc" stroke="#334155" />
          <rect x="22" y="16" width="20" height="6" fill="#111827" />
          <text x="24" y="21" fill="#d9f99d" fontSize="4">0000</text>
        </>
      )}
      {item.kind === 'office' && (
        <>
          <rect x="10" y="14" width="44" height="26" fill="#e7e5e4" stroke="#334155" />
          <rect x="16" y="20" width="8" height="8" fill="#7dd3fc" />
          <rect x="30" y="20" width="8" height="8" fill="#7dd3fc" />
          <rect x="40" y="26" width="8" height="14" fill="#1e293b" />
        </>
      )}
      {item.kind === 'console' && (
        <>
          <rect x="18" y="8" width="28" height="32" rx="2" fill="#1f2937" />
          <rect x="22" y="12" width="20" height="12" fill={item.role === 'leak-console' ? '#fb7185' : '#67e8f9'} />
          <circle cx="26" cy="32" r="2" fill="#22c55e" />
        </>
      )}
      {item.kind === 'probe' && (
        <>
          <rect x="30" y="6" width="4" height="34" fill="#cbd5e1" />
          <circle cx="32" cy="28" r="4" fill="#ef4444" />
        </>
      )}
      {item.kind === 'controller' && <rect x="16" y="12" width="32" height="24" rx="2" fill="#0f172a" />}
      {item.kind === 'rfid' && (
        <>
          <rect x="24" y="6" width="16" height="34" fill="#f8fafc" stroke="#011832" />
          <rect x="27" y="10" width="10" height="8" fill="#6ee7b7" />
        </>
      )}
      {(item.kind === 'leak-liquid' || item.kind === 'leak-gas') && <ellipse cx="32" cy="28" rx="12" ry="7" fill={item.kind === 'leak-gas' ? '#fbbf24' : '#0ea5e9'} />}
      {item.kind === 'overflow' && (
        <>
          <rect x="30" y="16" width="4" height="22" fill="#64748b" />
          <circle cx="32" cy="12" r="6" fill="#ef4444" />
        </>
      )}
      {item.kind === 'comms' && <rect x="16" y="16" width="28" height="18" fill="#111827" />}
      {item.kind === 'cloud' && <ellipse cx="32" cy="24" rx="16" ry="10" fill="#e0f2fe" stroke="#0284c7" />}
      {item.kind === 'receiver' && (
        <>
          <rect x="18" y="24" width="20" height="10" fill="#0f172a" />
          <rect x="34" y="16" width="14" height="6" fill="#1e3a8a" transform="rotate(-18 34 16)" />
        </>
      )}
      {item.kind === 'service' && <rect x="14" y="14" width="36" height="22" rx="2" fill="#011832" />}
    </svg>
  );
}

const BUILD_GROUPS: { title: string; ids: string[] }[] = [
  { title: 'Infraestructura', ids: ['tank-underground', 'tank-vertical', 'dispenser', 'loading-point', 'fuel-pump', 'flow-meter', 'mechanical-meter', 'office'] },
  { title: 'Telemedición', ids: ['console', 'leak-console', 'probe', 'solar'] },
  { title: 'Control', ids: ['controller', 'rfid', 'fleet', 'comms'] },
  { title: 'Alarmas', ids: ['leak-liquid', 'leak-gas', 'overflow'] },
  { title: 'Plataforma y software', ids: ['cloud', 'api', 'software', 'dev-4h', 'alerts', 'install', 'custom'] },
];

export default function LibraryPanel({
  armedId,
  highlightIds = [],
  onArm,
}: {
  armedId: string | null;
  highlightIds?: string[];
  onArm: (item: LibraryItem) => void;
}) {
  const marked = useRef<HTMLButtonElement | null>(null);
  const firstHighlight = highlightIds[0] ?? '';
  useEffect(() => {
    marked.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [firstHighlight]);
  const listed = new Set(BUILD_GROUPS.flatMap((group) => group.ids));
  const rest = LIBRARY.filter((item) => !listed.has(item.id));
  const groups = rest.length ? [...BUILD_GROUPS, { title: 'Otros', ids: rest.map((item) => item.id) }] : BUILD_GROUPS;
  return (
    <aside className="w-full h-full overflow-y-auto bg-[#fffaf3] border-r border-[#efe4d2]">
      <div className="px-4 py-4 border-b border-[#efe4d2] bg-[#fffaf3]">
        <p className="text-sm font-semibold text-emerald-800">Piezas</p>
        <p className="text-sm text-stone-500 mt-1">Elegí una y colocala en la playa.</p>
      </div>
      {groups.map((group) => (
        <div key={group.title} className="px-3 py-3">
          <h3 className="text-xs font-semibold text-stone-400 px-1 mb-2">{group.title}</h3>
          <div className="space-y-2">
            {group.ids.map((id) => LIBRARY.find((item) => item.id === id)).filter((item): item is LibraryItem => Boolean(item)).map((item) => (
              <button
                key={item.id}
                ref={highlightIds.includes(item.id) && item.id === firstHighlight ? marked : undefined}
                type="button"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('application/x-cesti', item.id);
                  event.dataTransfer.setData('text/plain', item.id);
                  event.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onArm(item)}
                title={item.description}
                className={`w-full flex items-center gap-3 text-left p-2 rounded-2xl border cursor-grab active:cursor-grabbing ${
                  armedId === item.id || highlightIds.includes(item.id) ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-[#efe4d2] bg-white hover:border-emerald-300'
                }`}
              >
                <Thumb item={item} />
                <span className="block text-sm font-semibold text-[#011832] leading-tight">{item.title}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
