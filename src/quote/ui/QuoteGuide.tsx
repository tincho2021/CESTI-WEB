import type { SceneState } from '../types';

const STORAGE_KEY = 'cesti-quote-guide';

type GuideMemory = { off: boolean; skipped: string[] };

export type GuideStep = {
  id: string;
  title: string;
  body: string;
  done: (scene: SceneState) => boolean;
};

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'tank',
    title: 'Colocá el tanque',
    body: 'Elegí un tanque en Piezas y soltalo en la playa. Si este cliente no tiene tanque propio, omití el paso.',
    done: (scene) => scene.objects.some((object) => object.role === 'tank'),
  },
  {
    id: 'pump',
    title: 'Si despacha, sumá el surtidor',
    body: 'Un surtidor o un punto de carga alcanza. Si acá no se despacha combustible, este paso no aplica.',
    done: (scene) => scene.objects.some((object) => object.role === 'dispenser' || object.role === 'loading-point'),
  },
  {
    id: 'office',
    title: 'Marcá dónde está la oficina',
    body: 'La oficina es el lugar de la consola. Si todavía no la definieron, podés seguir sin ella.',
    done: (scene) => scene.objects.some((object) => object.role === 'office'),
  },
  {
    id: 'probe',
    title: 'Medí el nivel del tanque',
    body: 'Seleccioná el tanque y tocá Agregar sonda. Si no van a telemedir, omitilo.',
    done: (scene) => scene.objects.some((object) => object.role === 'probe'),
  },
  {
    id: 'console',
    title: 'Sumá la consola',
    body: 'La consola recibe el nivel. Se agrega a la cotización recién cuando confirmás. Si no la van a instalar ahora, omití el paso.',
    done: (scene) => scene.objects.some((object) => object.role === 'console-telemetry'),
  },
  {
    id: 'suction',
    title: 'Origen de cada manguera',
    body: 'Las succiones no son obligatorias. Sirven para decir de qué tanque sale cada manguera. Si no las conocés, o no aplican a este cliente, omití este paso.',
    done: (scene) => {
      const pumps = scene.objects.filter((object) => object.role === 'dispenser' || object.role === 'loading-point');
      if (pumps.length === 0) return false;
      return pumps.every((pump) => (pump.props.outlets ?? []).some((outlet) => Boolean(outlet.tankId)) || scene.connections.some((connection) => connection.type === 'process' && (connection.fromId === pump.id || connection.toId === pump.id)));
    },
  },
  {
    id: 'quote',
    title: 'Generá el presupuesto',
    body: 'Con Guardar y Cotizar sale el PDF. Los datos que no tengas pueden quedar vacíos.',
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
    <div className="absolute left-3 top-3 z-20 w-72 rounded-3xl bg-[#fffaf3]/95 border border-[#efe4d2] shadow-lg p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Asistente · {index} de {GUIDE_STEPS.length}</p>
        <button type="button" className="text-[11px] font-semibold text-stone-500" onClick={onDismiss}>Omitir asistente</button>
      </div>
      {step ? (
        <>
          <p className="text-base font-semibold mt-2">{step.title}</p>
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
