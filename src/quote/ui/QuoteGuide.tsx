import type { SceneState } from '../types';

const STORAGE_KEY = 'cesti-quote-guide';

type GuideMemory = { off: boolean; skipped: string[] };

export type GuideStep = {
  id: string;
  title: string;
  body: string;
  where: string;
  pieceIds: string[];
  done: (scene: SceneState) => boolean;
};

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'tank',
    title: 'Colocá el tanque',
    where: 'Columna izquierda, Piezas, sección Infraestructura. Los botones se llaman Tanque subterráneo y Tanque vertical agropecuario.',
    pieceIds: ['tank-underground', 'tank-vertical'],
    body: 'Tocá uno de esos botones y después hacé clic en la playa. Si este cliente no tiene tanque propio, omití el paso.',
    done: (scene) => scene.objects.some((object) => object.role === 'tank'),
  },
  {
    id: 'pump',
    title: 'Si despacha, sumá el surtidor',
    where: 'Columna izquierda, Piezas, sección Infraestructura. El botón se llama Surtidor de combustible. Más abajo está Punto de carga industrial.',
    pieceIds: ['dispenser', 'loading-point'],
    body: 'Tocá el botón marcado y soltalo en la playa. Si acá no se despacha combustible, omití el paso.',
    done: (scene) => scene.objects.some((object) => object.role === 'dispenser' || object.role === 'loading-point'),
  },
  {
    id: 'office',
    title: 'Marcá dónde está la oficina',
    where: 'Menú de la izquierda, en Piezas, sección Infraestructura. Bajá con la rueda en esa columna: Oficina / sala de control está más abajo, después de los tanques y el surtidor.',
    pieceIds: ['office'],
    body: 'Cuando lo veas, tocá ese botón y soltalo en la playa. Si todavía no definieron la oficina, omití el paso.',
    done: (scene) => scene.objects.some((object) => object.role === 'office'),
  },
  {
    id: 'probe',
    title: 'Medí el nivel del tanque',
    where: 'En la playa, presioná el tanque. Aparece un cartel con el botón Agregar sonda.',
    pieceIds: [],
    body: 'Tocá Agregar sonda. Eso sí la instala en el tanque. Soltarla desde el menú no la une. Si no van a telemedir, omití el paso.',
    done: (scene) => scene.objects.some((object) => object.role === 'probe'),
  },
  {
    id: 'console',
    title: 'Sumá la consola',
    where: 'Columna izquierda, Piezas, sección Telemedición. El primer botón se llama Consola de telemedición.',
    pieceIds: ['console'],
    body: 'Tocá Consola de telemedición y soltala cerca de la oficina. Entra a la cotización cuando la confirmás. Si no la instalan ahora, omití el paso.',
    done: (scene) => scene.objects.some((object) => object.role === 'console-telemetry'),
  },
  {
    id: 'suction',
    title: 'Origen de cada manguera',
    where: 'No es una pieza de la lista. Tocá el surtidor que ya está en la playa y, en la barra que aparece arriba de él, el botón Conectar.',
    pieceIds: [],
    body: 'Después elegí el tanque. Las succiones no son obligatorias: si no las conocés, omití este paso.',
    done: (scene) => {
      const pumps = scene.objects.filter((object) => object.role === 'dispenser' || object.role === 'loading-point');
      if (pumps.length === 0) return false;
      return pumps.every((pump) => (pump.props.outlets ?? []).some((outlet) => Boolean(outlet.tankId)) || scene.connections.some((connection) => connection.type === 'process' && (connection.fromId === pump.id || connection.toId === pump.id)));
    },
  },
  {
    id: 'quote',
    title: 'Generá el presupuesto',
    where: 'Abajo a la derecha de la pantalla. Los botones se llaman Guardar y Cotizar.',
    pieceIds: [],
    body: 'Los datos que no tengas pueden quedar vacíos.',
    done: () => false,
  },
];

export function readGuide(): GuideMemory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { off: false, skipped: [] };
    const parsed = JSON.parse(raw) as Partial<GuideMemory>;
    return { off: parsed.off === true, skipped: Array.isArray(parsed.skipped) ? parsed.skipped : [] };
  } catch {
    return { off: false, skipped: [] };
  }
}

export function writeGuide(memory: GuideMemory) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
}

export function nextGuideStep(scene: SceneState, skipped: string[]): GuideStep | null {
  return GUIDE_STEPS.find((step) => !skipped.includes(step.id) && !step.done(scene)) ?? null;
}

export default function QuoteGuide({
  scene,
  skipped,
  onSkipStep,
  onDismiss,
}: {
  scene: SceneState;
  skipped: string[];
  onSkipStep: (id: string) => void;
  onDismiss: () => void;
}) {
  const step = nextGuideStep(scene, skipped);
  const index = step ? GUIDE_STEPS.findIndex((item) => item.id === step.id) + 1 : GUIDE_STEPS.length;

  return (
    <div className="absolute left-1/2 bottom-20 z-20 w-[min(28rem,calc(100%-1.5rem))] -translate-x-1/2 rounded-3xl bg-[#fffaf3]/95 border border-[#efe4d2] shadow-lg p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Asistente · {index} de {GUIDE_STEPS.length}</p>
        <button type="button" className="text-[11px] font-semibold text-stone-500" onClick={onDismiss}>Omitir asistente</button>
      </div>
      {step ? (
        <>
          <p className="text-base font-semibold mt-2">{step.title}</p>
          <p className="text-sm font-semibold text-emerald-900 mt-2">Dónde está: {step.where}</p>
          <p className="text-sm text-stone-600 mt-1">{step.body}</p>
          <button type="button" className="mt-3 text-sm font-semibold text-emerald-800" onClick={() => onSkipStep(step.id)}>Omitir este paso</button>
        </>
      ) : (
        <>
          <p className="text-base font-semibold mt-2">Ya podés cotizar</p>
          <p className="text-sm text-stone-600 mt-1">Completaste o omitiste los pasos. Guardá el proyecto y tocá Cotizar cuando quieras.</p>
          <button type="button" className="mt-3 text-sm font-semibold text-emerald-800" onClick={onDismiss}>Cerrar</button>
        </>
      )}
    </div>
  );
}
