import { money } from '../specs';
import type { BomResult } from '../types';

export default function StatusBar({
  tanks,
  dispensers,
  probes,
  equipment,
  warnings,
  bom,
  busy,
  readOnly,
  onSave,
  onQuote,
}: {
  tanks: number;
  dispensers: number;
  probes: number;
  equipment: number;
  warnings: number;
  bom: BomResult;
  busy: boolean;
  readOnly: boolean;
  onSave: () => void;
  onQuote: () => void;
}) {
  const cells = [
    ['Tanques', tanks],
    ['Surtidores', dispensers],
    ['Sondas', probes],
    ['Equipos C.E.S.T.I.', equipment],
    ['Avisos', warnings],
  ] as const;

  return (
    <footer className="h-auto min-h-14 border-t border-[#efe4d2] bg-[#fffaf3] px-3 py-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {cells.map(([label, value]) => (
          <span key={label} className="text-[11px] text-gray-500">
            {label} <strong className="text-[#011832]">{value}</strong>
          </span>
        ))}
        <span className="text-[11px] text-gray-500">
          Subtotal <strong className="text-[#011832]">{money(bom.onceSubtotal, bom.currency)}</strong>
          {bom.pendingCount > 0 && <strong className="text-red-600"> · {bom.pendingCount} a cotizar</strong>}
        </span>
      </div>
      <div className="flex gap-2">
        <button type="button" disabled={busy || readOnly} onClick={onSave} className="px-4 py-2 rounded-full border border-emerald-800 text-sm font-semibold text-emerald-900 disabled:opacity-40">
          Guardar
        </button>
        <button type="button" disabled={busy || readOnly} onClick={onQuote} className="px-4 py-2 rounded-full bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40">
          Cotizar
        </button>
      </div>
    </footer>
  );
}
