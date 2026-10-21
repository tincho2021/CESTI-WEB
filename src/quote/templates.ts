import { createObject, emptyScene, nextName } from './library';
import type { InstallationType, SceneState } from './types';

function place(scene: SceneState, input: Parameters<typeof createObject>[0]): SceneState {
  if (scene.objects.length >= 60) return scene;
  const object = createObject({ ...input, name: input.name || nextName(scene.objects, 'X') });
  return { ...scene, objects: [...scene.objects, object] };
}

export function templateScene(type: InstallationType): SceneState {
  const base = emptyScene();
  base.installationType = type;
  if (type === 'blank') return base;

  if (type === 'station') {
    let scene = place(base, { kind: 'office', role: 'office', name: 'Oficina 1', x: -7.5, z: -4.2 });
    scene = place(scene, { kind: 'tank-underground', role: 'tank', name: 'Tanque subterráneo 1', x: -3.2, z: -1.8 });
    scene = place(scene, { kind: 'tank-underground', role: 'tank', name: 'Tanque subterráneo 2', x: 1.4, z: 2.4 });
    scene = place(scene, {
      kind: 'dispenser',
      role: 'dispenser',
      name: 'Surtidor 1',
      x: 5.6,
      z: 0.3,
      props: { hoseCount: 2, productCount: 2, outlets: [{ product: '', tankId: null }, { product: '', tankId: null }] },
    });
    return scene;
  }

  if (type === 'agro') {
    let scene = place(base, { kind: 'office', role: 'office', name: 'Oficina 1', x: -14, z: 0 });
    scene = place(scene, { kind: 'tank-vertical', role: 'tank', name: 'Tanque vertical 1', x: 2, z: -6 });
    scene = place(scene, { kind: 'tank-vertical', role: 'tank', name: 'Tanque vertical 2', x: 2, z: 6 });
    return scene;
  }

  let scene = place(base, { kind: 'office', role: 'office', name: 'Oficina 1', x: -14, z: -6 });
  scene = place(scene, { kind: 'tank-underground', role: 'tank', name: 'Tanque subterráneo 1', x: -3, z: 1 });
  scene = place(scene, {
    kind: 'dispenser',
    role: 'dispenser',
      name: 'Surtidor 1',
    x: 8,
    z: 1,
    props: { needsRfid: true, needsControl: true, hoseCount: 2, productCount: 2, outlets: [{ product: '', tankId: null }, { product: '', tankId: null }] },
  });
  return scene;
}
