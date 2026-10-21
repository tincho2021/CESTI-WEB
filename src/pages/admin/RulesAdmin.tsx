import { useEffect, useState } from 'react';
import { useProducts } from '../../context/ProductContext';
import { loadSettings, saveSettings } from '../../quote/storage';
import { defaultSettings } from '../../quote/settings';
import type { RoleBinding, TechnicalSettings } from '../../quote/types';

export default function RulesAdmin() {
  const { products } = useProducts();
  const [settings, setSettings] = useState<TechnicalSettings>(defaultSettings());
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadSettings().then(setSettings).catch(() => setError('No se pudo leer la configuración.'));
  }, []);

  const updateBinding = (role: string, patch: Partial<RoleBinding>) => {
    setSettings((current) => ({
      ...current,
      bindings: current.bindings.map((binding) => binding.role === role ? { ...binding, ...patch } : binding),
    }));
  };

  return (
    <form
      className="bg-white border border-gray-200 p-6 space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setError('');
        try {
          await saveSettings(settings);
          setMessage('Reglas guardadas. El configurador las usa en la próxima cotización.');
        } catch (saveError) {
          setError(saveError instanceof Error ? saveError.message : 'No se pudieron guardar las reglas.');
        }
      }}
    >
      <div>
        <h2 className="text-xl font-bold uppercase tracking-tight">Reglas técnicas y condiciones comerciales</h2>
        <p className="text-sm text-gray-500 mt-1">Si un cupo o un precio no está en la ficha, el configurador lo deja pendiente. No completa el dato por su cuenta.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Moneda
          <input className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-normal normal-case" value={settings.currency} onChange={(event) => setSettings({ ...settings, currency: event.target.value.toUpperCase() })} />
        </label>
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Impuesto %
          <input className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-normal" placeholder="Pendiente" value={settings.taxPercent ?? ''} onChange={(event) => setSettings({ ...settings, taxPercent: event.target.value === '' ? null : Number(event.target.value) })} />
        </label>
        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Validez (días)
          <input className="mt-1 w-full border border-gray-200 px-3 py-2 text-sm font-normal" placeholder="Pendiente" value={settings.validityDays ?? ''} onChange={(event) => setSettings({ ...settings, validityDays: event.target.value === '' ? null : Number(event.target.value) })} />
        </label>
      </div>
      <div className="space-y-4">
        {settings.bindings.map((binding) => (
          <fieldset key={binding.role} className="border border-gray-100 p-4">
            <legend className="px-2 text-sm font-bold">{binding.label}</legend>
            <div className="grid md:grid-cols-2 gap-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Producto del catálogo
                <select className="mt-1 w-full border border-gray-200 px-2 py-2 text-sm font-normal normal-case" value={binding.productId ?? ''} onChange={(event) => updateBinding(binding.role, { productId: event.target.value || null })}>
                  <option value="">Sin ficha — A COTIZAR</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
                </select>
              </label>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Capacidad manual
                <input className="mt-1 w-full border border-gray-200 px-2 py-2 text-sm font-normal" placeholder={binding.capacitySpecKey ? `Si queda vacío, se lee "${binding.capacitySpecKey}"` : 'Sin dato publicado'} value={binding.capacityOverride ?? ''} onChange={(event) => updateBinding(binding.role, { capacityOverride: event.target.value === '' ? null : Number(event.target.value) })} />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 md:col-span-2">Protocolos manuales, separados por coma
                <input className="mt-1 w-full border border-gray-200 px-2 py-2 text-sm font-normal normal-case" placeholder="Vacío: se usan los de la ficha" value={binding.protocolsOverride?.join(', ') ?? ''} onChange={(event) => updateBinding(binding.role, { protocolsOverride: event.target.value.trim() ? event.target.value.split(',').map((item) => item.trim()).filter(Boolean) : null })} />
              </label>
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 md:col-span-2">Incompatible con roles
                <input className="mt-1 w-full border border-gray-200 px-2 py-2 text-sm font-normal" value={binding.incompatibleWith.join(', ')} onChange={(event) => updateBinding(binding.role, { incompatibleWith: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })} />
              </label>
            </div>
            {binding.notes && <p className="text-xs text-gray-500 mt-2">{binding.notes}</p>}
          </fieldset>
        ))}
      </div>
      {message && <p className="text-sm text-green-700">{message}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" className="bg-black text-white px-5 py-3 text-xs font-bold uppercase tracking-widest">Guardar reglas</button>
    </form>
  );
}
