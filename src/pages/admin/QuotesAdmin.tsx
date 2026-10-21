import { useEffect, useMemo, useState } from 'react';
import { useProducts } from '../../context/ProductContext';
import { buildBom } from '../../quote/bom';
import { downloadQuotePdf } from '../../quote/pdf';
import { analyzeInstallation } from '../../quote/engine';
import { defaultSettings, sanitizeSettings } from '../../quote/settings';
import { loadQuoteIndex, loadSettings, saveQuote, updateIndexedQuote } from '../../quote/storage';
import { QUOTE_STATUSES, type QuoteStatus, type StoredQuote } from '../../quote/types';
import { money } from '../../quote/specs';

export default function QuotesAdmin() {
  const { products } = useProducts();
  const [quotes, setQuotes] = useState<StoredQuote[]>([]);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selected = quotes.find((quote) => quote.quoteNumber === selectedId) ?? null;

  const reload = async () => {
    try {
      setQuotes(await loadQuoteIndex());
      setError('');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron leer las cotizaciones. Revisá que las reglas de Firestore estén publicadas.');
    }
  };

  useEffect(() => { void reload(); }, []);

  const visible = useMemo(() => quotes.filter((quote) => {
    const haystack = `${quote.quoteNumber} ${quote.customer?.name ?? ''} ${quote.customer?.email ?? ''} ${quote.customer?.company ?? ''}`.toLowerCase();
    if (query && !haystack.includes(query.toLowerCase())) return false;
    const day = quote.createdAt.slice(0, 10);
    if (from && day < from) return false;
    if (to && day > to) return false;
    return true;
  }), [quotes, query, from, to]);

  const changeStatus = async (status: QuoteStatus) => {
    if (!selected) return;
    setBusy(true);
    try {
      await updateIndexedQuote(selected.quoteNumber, { status });
      await reload();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo actualizar el estado.');
    } finally {
      setBusy(false);
    }
  };

  const setOverride = async (key: string, value: string) => {
    if (!selected) return;
    const next = { ...selected.priceOverrides };
    const parsed = Number(value);
    if (!value.trim()) delete next[key];
    else if (Number.isFinite(parsed) && parsed >= 0) next[key] = parsed;
    setBusy(true);
    try {
      const settings = sanitizeSettings(await loadSettings());
      const bom = buildBom(selected.scene, settings, products, next);
      await updateIndexedQuote(selected.quoteNumber, { priceOverrides: next, bom });
      await reload();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudo guardar el precio.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 p-4 flex flex-col md:flex-row gap-3">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por número o cliente" className="flex-1 border border-gray-200 px-3 py-2 text-sm" />
        <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="border border-gray-200 px-3 py-2 text-sm" />
        <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className="border border-gray-200 px-3 py-2 text-sm" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid lg:grid-cols-[1fr_1.1fr] gap-6">
        <div className="bg-white border border-gray-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-[10px] uppercase tracking-widest text-gray-400">
              <tr>
                <th className="text-left p-3">Número</th>
                <th className="text-left p-3">Cliente</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-right p-3">Total definido</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((quote) => (
                <tr key={quote.quoteNumber} className={`border-t border-gray-100 cursor-pointer ${selectedId === quote.quoteNumber ? 'bg-red-50' : ''}`} onClick={() => setSelectedId(quote.quoteNumber)}>
                  <td className="p-3 font-bold">{quote.quoteNumber}</td>
                  <td className="p-3">{quote.customer?.name || 'Sin nombre'}</td>
                  <td className="p-3">{QUOTE_STATUSES.find((status) => status.id === quote.status)?.label}</td>
                  <td className="p-3 text-right">{money(quote.bom?.totalPriced ?? 0, quote.bom?.currency || 'USD')}</td>
                </tr>
              ))}
              {visible.length === 0 && <tr><td className="p-4 text-gray-400" colSpan={4}>No hay cotizaciones para ese filtro.</td></tr>}
            </tbody>
          </table>
        </div>
        {selected && (
          <div className="bg-white border border-gray-200 p-4 space-y-4">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold">{selected.quoteNumber}</h3>
                <p className="text-xs text-gray-500">Revisión {selected.revision} · {new Date(selected.updatedAt).toLocaleString('es-AR')}</p>
              </div>
              <select disabled={busy} value={selected.status} onChange={(event) => void changeStatus(event.target.value as QuoteStatus)} className="border border-gray-200 px-2 py-2 text-sm">
                {QUOTE_STATUSES.map((status) => <option key={status.id} value={status.id}>{status.label}</option>)}
              </select>
            </div>
            {selected.previewImage && <img src={selected.previewImage} alt="Escenario cotizado" className="w-full border border-gray-100" />}
            <p className="text-sm">{selected.customer?.name} · {selected.customer?.email} · {selected.customer?.phone}</p>
            <div className="space-y-2">
              {selected.bom.lines.filter((line) => line.section !== 'infrastructure').map((line) => (
                <div key={line.key} className="flex items-center justify-between gap-3 text-sm border-b border-gray-100 pb-2">
                  <span>{line.quantity} × {line.name}</span>
                  {line.priceOrigin === 'unpriced' || line.unitPrice == null ? (
                    <input
                      className="w-28 border border-gray-200 px-2 py-1 text-right"
                      placeholder="A cotizar"
                      defaultValue={selected.priceOverrides[line.key] ?? ''}
                      onBlur={(event) => void setOverride(line.key, event.target.value)}
                    />
                  ) : (
                    <span>{money(line.unitPrice, selected.bom.currency)}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="px-3 py-2 bg-black text-white text-[10px] font-bold uppercase" onClick={() => {
                const settings = defaultSettings();
                void downloadQuotePdf(selected, analyzeInstallation(selected.scene, settings, products).findings, window.location.origin);
              }}>Descargar PDF</button>
              <button type="button" className="px-3 py-2 border border-gray-300 text-[10px] font-bold uppercase" onClick={() => {
                const blob = new Blob([JSON.stringify(selected, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const anchor = document.createElement('a');
                anchor.href = url;
                anchor.download = `${selected.quoteNumber}.json`;
                anchor.click();
                URL.revokeObjectURL(url);
              }}>Exportar</button>
              <button type="button" disabled={busy} className="px-3 py-2 border border-gray-300 text-[10px] font-bold uppercase" onClick={async () => {
                setBusy(true);
                try {
                  const settings = sanitizeSettings(await loadSettings());
                  const copy = await saveQuote({
                    scene: selected.scene,
                    customer: selected.customer ?? { name: 'Duplicado', company: '', email: 'duplicado@cesti.local', phone: '000000', location: '', activity: 'other', notes: `Copia de ${selected.quoteNumber}` },
                    settings,
                    products,
                    priceOverrides: selected.priceOverrides,
                    previewImage: selected.previewImage,
                  });
                  setSelectedId(copy.quoteNumber);
                  await reload();
                } catch (copyError) {
                  setError(copyError instanceof Error ? copyError.message : 'No se pudo duplicar.');
                } finally {
                  setBusy(false);
                }
              }}>Duplicar</button>
            </div>
            <p className="text-[11px] text-gray-400">El código de edición no se muestra acá. Lo tiene quien generó la cotización. Duplicar crea un proyecto nuevo con su propio código.</p>
          </div>
        )}
      </div>
    </div>
  );
}
