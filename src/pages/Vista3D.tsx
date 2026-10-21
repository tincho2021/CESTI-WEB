import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import InstallationCanvas, { type SceneApi } from '../quote/scene/InstallationCanvas';
import { lastVistaQuoteNumber, loadPublicQuote } from '../quote/storage';
import type { SceneState, StoredQuote } from '../quote/types';

export default function Vista3D() {
  const [params] = useSearchParams();
  const [quote, setQuote] = useState<StoredQuote | null>(null);
  const [missing, setMissing] = useState(false);
  const apiRef = useRef<SceneApi | null>(null);

  useEffect(() => {
    const number = params.get('ver') || lastVistaQuoteNumber();
    if (!number) {
      setMissing(true);
      return;
    }
    let alive = true;
    void loadPublicQuote(number).then((loaded) => {
      if (!alive) return;
      if (!loaded) setMissing(true);
      else setQuote(loaded);
    });
    return () => { alive = false; };
  }, [params]);

  useEffect(() => {
    if (!quote) return;
    const timer = window.setTimeout(() => apiRef.current?.frame(quote.scene.objects.map((object) => ({ x: object.x, z: object.z }))), 80);
    return () => window.clearTimeout(timer);
  }, [quote]);

  if (missing) {
    return (
      <div className="pt-28 px-6 max-w-xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-[#011832]">Vista 3D</h1>
        <p className="mt-3 text-stone-600">Se habilita cuando guardás o cotizás una instalación. Todavía no hay una cotización terminada en este navegador.</p>
        <Link to="/cotizacion-online" className="inline-block mt-6 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Ir a cotizar</Link>
      </div>
    );
  }

  if (!quote) {
    return <div className="pt-28 text-center text-sm text-stone-500">Abriendo la cotización…</div>;
  }

  const scene: SceneState = { ...quote.scene, showLabels: true, showConnections: true };

  return (
    <div className="h-[calc(100dvh-5rem)] mt-20 flex flex-col bg-[#e7f3e4]">
      <header className="h-12 shrink-0 bg-[#fffaf3] border-b border-[#efe4d2] px-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[#011832]">Vista 3D</p>
          <p className="text-[11px] text-stone-500">{quote.quoteNumber} · revisión {quote.revision}</p>
        </div>
        <Link to={`/cotizacion-online?ver=${encodeURIComponent(quote.quoteNumber)}`} className="text-sm font-semibold text-emerald-800">Volver a la cotización</Link>
      </header>
      <div className="flex-1 min-h-0 relative">
        <InstallationCanvas
          scene={scene}
          selectedId={null}
          selectedConnectionId={null}
          armed={false}
          linkFrom={null}
          linkType={null}
          linkIndex={0}
          layerFilter="all"
          snapGrid={false}
          allowDrag={false}
          reports={new Map()}
          apiRef={apiRef}
          onSelect={() => undefined}
          onSelectConnection={() => undefined}
          onDragStart={() => undefined}
          onMove={() => undefined}
          onMoveEnd={() => undefined}
          onPlace={() => undefined}
          onDropItem={() => undefined}
          onLinkTarget={() => undefined}
          onPort={() => undefined}
        />
      </div>
    </div>
  );
}
