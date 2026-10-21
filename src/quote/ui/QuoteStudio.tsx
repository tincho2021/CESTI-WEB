import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Network, Play, Plug, Redo2, SlidersHorizontal, Undo2, ZoomIn } from 'lucide-react';
import { db } from '../../lib/firebase';
import { useProducts } from '../../context/ProductContext';
import { buildBom } from '../bom';
import { COMPANY } from '../company';
import { analyzeInstallation, assessConnection, connectionLayer } from '../engine';
import { uid } from '../ids';
import { createObject, deviceLabel, emptyScene, LIBRARY, nextName, snap } from '../library';
import { downloadQuotePdf } from '../pdf';
import { defaultSettings, sanitizeSettings } from '../settings';
import InstallationCanvas, { CONNECTION_LABELS, frameExtents, insidePlot, type SceneApi } from '../scene/InstallationCanvas';
import { connectionTouches, detachOrRemove, familyIds, installProbe, possibleLinks, presentScene, probeVisual, rotateObject, suggestConnections, syncFuelLinks, transmitterHost, type LayerFilter } from '../scene/logic';
import type { ScenePort } from '../scene/ports';
import { emptyCustomer, loadPrivateQuote, loadPublicQuote, saveQuote, validateCustomer } from '../storage';
import { templateScene } from '../templates';
import {
  ACTIVITIES,
  MAX_CONNECTIONS,
  MAX_OBJECTS,
  type ConnectionType,
  type Customer,
  type InstallationType,
  type LibraryItem,
  type SceneConnection,
  type SceneObject,
  type SceneState,
  type StoredQuote,
  type Suggestion,
  type TechnicalSettings,
} from '../types';
import Inspector from './Inspector';
import InspectCard from './InspectCard';
import LibraryPanel from './LibraryPanel';
import StatusBar from './StatusBar';
import TopologyView from './TopologyView';

const LINK_ORDER: ConnectionType[] = ['sensor', 'wireless', 'process', 'dispenser-control', 'ethernet', 'rs485', 'wifi', 'cloud', 'alarm', 'association'];
const STORY_DATA = new Set<ConnectionType>(['sensor', 'wireless', 'rs485', 'ethernet', 'wifi', 'cloud', 'dispenser-control']);

function roleAccepts(type: ConnectionType, role: string) {
  if (type === 'sensor' || type === 'wireless' || type === 'rs485' || type === 'alarm') return role === 'console-telemetry' || role === 'leak-console';
  if (type === 'process') return ['tank', 'dispenser', 'loading-point', 'fuel-pump', 'flow-meter', 'mechanical-meter'].includes(role);
  if (type === 'dispenser-control') return role === 'dispenser-controller' || role === 'dispenser' || role === 'loading-point';
  if (type === 'ethernet' || type === 'wifi') return role === 'console-telemetry' || role === 'office' || role === 'cloud' || role === 'comms' || role === 'dispenser-controller';
  if (type === 'cloud') return role === 'cloud' || role === 'console-telemetry';
  if (type === 'association') return role === 'dispenser' || role === 'loading-point' || role === 'mechanical-meter' || role === 'rfid-rlcd';
  return true;
}

function friendlyError(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : '';
  if (/permission|insufficient/i.test(message)) return 'No hay permiso para guardar o abrir la cotización en la base. Hay que publicar las reglas de Firestore.';
  return message || fallback;
}

function displayName(scene: SceneState, id: string) {
  const object = scene.objects.find((item) => item.id === id);
  return object ? deviceLabel(object, scene) : id;
}

function storyCaption(connection: SceneConnection, scene: SceneState) {
  const from = scene.objects.find((object) => object.id === connection.fromId);
  const to = scene.objects.find((object) => object.id === connection.toId);
  const tank = from?.role === 'tank' ? from : to?.role === 'tank' ? to : null;
  const pump = (from?.role === 'dispenser' || from?.role === 'loading-point') ? from : (to?.role === 'dispenser' || to?.role === 'loading-point') ? to : null;
  if (connection.type === 'process' && tank && pump) return `${deviceLabel(tank, scene)} abastece a ${deviceLabel(pump, scene)}. Es la asociación de producto configurada, no una cañería verificada.`;
  if (connection.type === 'cloud') return 'La plataforma C.E.S.T.I. permite consultar información de forma remota. Este vínculo es de configuración, no telemetría en vivo.';
  if (from?.role === 'probe' || to?.role === 'probe') return 'Esta sonda mide el nivel del combustible.';
  if (from?.role === 'console-telemetry' || to?.role === 'console-telemetry') return 'La consola recibe los datos de los tanques.';
  if (connection.type === 'dispenser-control') return 'El controlador queda asociado a ese surtidor.';
  return 'Así circula la información en la configuración actual.';
}

async function shrinkCapture(dataUrl: string): Promise<string> {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();
  const scale = Math.min(1, 960 / image.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.72);
}

const TEMPLATES: { id: InstallationType; title: string; text: string }[] = [
  { id: 'station', title: 'Estación de servicio', text: 'Dos tanques enterrados, un surtidor y la oficina. Sin medidas inventadas.' },
  { id: 'agro', title: 'Instalación agropecuaria', text: 'Dos tanques verticales separados de la oficina, listos para configurar.' },
  { id: 'fleet', title: 'Flota de vehículos', text: 'Un tanque, un surtidor con identificación pedida y la sala de control.' },
  { id: 'blank', title: 'Proyecto desde cero', text: 'La playa queda vacía para armar la instalación a mano.' },
];

export default function QuoteStudio() {
  const { products } = useProducts();
  const [params, setParams] = useSearchParams();
  const [settings, setSettings] = useState<TechnicalSettings>(defaultSettings);
  const [scene, setScene] = useState<SceneState>(emptyScene);
  const [started, setStarted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [armed, setArmed] = useState<LibraryItem | null>(null);
  const [linkFrom, setLinkFrom] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<ConnectionType | null>(null);
  const [linkIndex, setLinkIndex] = useState(0);
  const [pendingLink, setPendingLink] = useState<{ fromId: string; toId: string; type: ConnectionType; hoseIndex: number | null; status: string; message: string } | null>(null);
  const [proposal, setProposal] = useState<SceneConnection[] | null>(null);
  const [diagram, setDiagram] = useState(false);
  const [story, setStory] = useState<'data' | 'fuel' | null>(null);
  const [storyStep, setStoryStep] = useState(0);
  const [glowId, setGlowId] = useState<string | null>(null);
  const [paidAsk, setPaidAsk] = useState<string | null>(null);
  const [layerFilter, setLayerFilter] = useState<LayerFilter>('all');
  const [snapGrid, setSnapGrid] = useState(true);
  const [tool, setTool] = useState<'select' | 'move' | 'connect'>('select');
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recoverCode, setRecoverCode] = useState('');
  const [pendingAction, setPendingAction] = useState<'save' | 'pdf' | null>(null);
  const [quote, setQuote] = useState<StoredQuote | null>(null);
  const [readOnly, setReadOnly] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mobilePanel, setMobilePanel] = useState<'library' | 'inspector' | null>('library');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const history = useRef<SceneState[]>([]);
  const future = useRef<SceneState[]>([]);
  const sceneRef = useRef(scene);
  const dragOrigin = useRef<SceneState | null>(null);
  const apiRef = useRef<SceneApi | null>(null);
  const loadedKey = useRef('');
  sceneRef.current = scene;

  useEffect(() => {
    const next = presentScene(sceneRef.current);
    if (next !== sceneRef.current) setScene(next);
  }, []);

  useEffect(() => {
    return onSnapshot(doc(db, 'quoteSettings', 'config'), (snap) => {
      setSettings(snap.exists() ? sanitizeSettings(snap.data()) : defaultSettings());
    }, () => setSettings(defaultSettings()));
  }, []);

  useEffect(() => {
    const edit = params.get('editar');
    const view = params.get('ver');
    const key = edit ? `e:${edit}` : view ? `v:${view}` : '';
    if (!key || loadedKey.current === key) return;
    loadedKey.current = key;
    const run = async () => {
      try {
        const loaded = edit ? await loadPrivateQuote(edit) : await loadPublicQuote(view || '');
        if (!loaded) {
          setError(null);
          setMessage('No encontramos esa cotización. Podés seguir armando en la playa.');
          return;
        }
        setQuote(loaded);
        setScene(loaded.scene);
        setCustomer(loaded.customer ?? emptyCustomer());
        setStarted(true);
        setReadOnly(!edit);
        setMessage(edit ? `Proyecto ${loaded.quoteNumber}, revisión ${loaded.revision}.` : 'Vista de consulta. Para modificarla hace falta el código de recuperación.');
      } catch (loadError) {
        const message = loadError instanceof Error ? loadError.message : '';
        if (/permission|insufficient/i.test(message)) {
          setError(null);
          setMessage('Seguí armando acá. El guardado en la nube queda para cuando la base lo permita.');
          return;
        }
        setError(friendlyError(loadError, 'No se pudo abrir la cotización.'));
      }
    };
    void run();
  }, [params]);

  const analysis = useMemo(() => {
    const report = analyzeInstallation(scene, settings, products);
    const bom = buildBom(scene, settings, products, quote?.priceOverrides ?? {});
    return { ...report, bom };
  }, [scene, settings, products, quote?.priceOverrides]);

  const selected = scene.objects.find((object) => object.id === selectedId) ?? null;
  const selectedConnection = scene.connections.find((connection) => connection.id === selectedConnectionId) ?? null;
  const connectionMessage = selectedConnection ? analysis.findings.find((finding) => finding.connectionId === selectedConnection.id)?.message : undefined;
  const storySteps = useMemo(() => {
    if (!story) return [];
    return scene.connections
      .filter((connection) => (story === 'fuel' ? connection.type === 'process' : STORY_DATA.has(connection.type)))
      .map((connection) => ({ id: connection.id, fromId: connection.fromId, toId: connection.toId, text: storyCaption(connection, scene) }));
  }, [story, scene]);
  const storyLink = storySteps.length ? storySteps[storyStep % storySteps.length] : null;

  useEffect(() => {
    if (!story || storySteps.length === 0) return undefined;
    const timer = window.setInterval(() => setStoryStep((step) => step + 1), 2800);
    return () => window.clearInterval(timer);
  }, [story, storySteps.length]);

  const linkHints = useMemo(() => {
    const hints: Record<string, 'compatible' | 'pending' | 'blocked'> = {};
    if (tool !== 'connect' || !linkFrom) return hints;
    const host = scene.objects.find((object) => object.id === linkFrom && object.role === 'tank');
    const probeId = host ? scene.objects.find((object) => object.role === 'probe' && object.attachedTo === host.id)?.id : null;
    scene.objects.forEach((object) => {
      if (object.attachedTo || object.id === linkFrom) return;
      if (linkType && !roleAccepts(linkType, object.role)) {
        hints[object.id] = 'blocked';
        return;
      }
      const origins = probeId ? [linkFrom, probeId] : [linkFrom];
      let rank: 'compatible' | 'pending' | 'blocked' = 'blocked';
      origins.forEach((origin) => {
        if (origin === object.id) return;
        const options = possibleLinks(origin, object.id, scene, settings, products);
        const relevant = linkType ? options.filter((option) => option.type === linkType) : options;
        if (relevant.some((option) => option.status === 'compatible')) rank = 'compatible';
        else if (relevant.length > 0 && rank !== 'compatible') rank = 'pending';
      });
      hints[object.id] = rank;
    });
    return hints;
  }, [tool, linkFrom, linkType, scene, settings, products]);

  const badges = useMemo(() => {
    const map: Record<string, { text: string; tone: string }> = {};
    scene.objects.forEach((object) => {
      if (object.attachedTo) return;
      if (object.role === 'tank') {
        const visual = probeVisual(scene, object.id);
        if (visual === 'none') map[object.id] = { text: 'Sin sonda', tone: '#94a3b8' };
        else if (visual === 'unlinked') map[object.id] = { text: 'Falta conectar', tone: '#d97706' };
        else {
          const probe = scene.objects.find((item) => item.role === 'probe' && item.attachedTo === object.id);
          const link = scene.connections.find((connection) => {
            const ids = new Set([object.id, probe?.id]);
            return (ids.has(connection.fromId) || ids.has(connection.toId)) && (connection.type === 'sensor' || connection.type === 'wireless' || connection.type === 'rs485' || connection.type === 'ethernet');
          });
          const finding = link ? analysis.findings.find((item) => item.connectionId === link.id) : undefined;
          if (finding?.status === 'incompatible') map[object.id] = { text: 'Incompatible', tone: '#dc2626' };
          else if (finding?.status === 'compatible') map[object.id] = { text: 'Telemedición activa', tone: '#16a34a' };
          else map[object.id] = { text: 'Pendiente de verificación', tone: '#d97706' };
        }
        return;
      }
      const hoseNote = object.role === 'dispenser' || object.role === 'loading-point'
        ? `${object.props.hoseCount ?? object.props.outlets?.length ?? 0} mangueras`
        : '';
      const links = scene.connections.filter((connection) => connection.fromId === object.id || connection.toId === object.id);
      if (links.length === 0) {
        map[object.id] = { text: hoseNote, tone: '#94a3b8' };
        return;
      }
      const statuses = links.map((connection) => analysis.findings.find((item) => item.connectionId === connection.id)?.status);
      if (statuses.includes('incompatible')) map[object.id] = { text: hoseNote, tone: '#dc2626' };
      else if (statuses.every((status) => status === 'compatible')) map[object.id] = { text: hoseNote, tone: '#16a34a' };
      else map[object.id] = { text: hoseNote, tone: '#d97706' };
    });
    return map;
  }, [scene, analysis.findings]);

  const litIds = useMemo(() => {
    if (storyLink) return [...familyIds(scene, storyLink.fromId), ...familyIds(scene, storyLink.toId)];
    if (tool === 'connect') return [];
    const ids = new Set<string>();
    const absorb = (id: string | null) => {
      if (!id) return;
      familyIds(scene, id).forEach((item) => ids.add(item));
      scene.connections.forEach((connection) => {
        if (!connectionTouches(scene, connection, id)) return;
        familyIds(scene, connection.fromId).forEach((item) => ids.add(item));
        familyIds(scene, connection.toId).forEach((item) => ids.add(item));
      });
    };
    absorb(selectedId);
    if (selectedConnection) {
      familyIds(scene, selectedConnection.fromId).forEach((item) => ids.add(item));
      familyIds(scene, selectedConnection.toId).forEach((item) => ids.add(item));
    }
    return [...ids];
  }, [storyLink, tool, scene, selectedId, selectedConnection]);

  function commit(next: SceneState) {
    history.current.push(structuredClone(sceneRef.current));
    if (history.current.length > 40) history.current.shift();
    future.current = [];
    setScene(next);
  }

  function undo() {
    const previous = history.current.pop();
    if (!previous) return;
    future.current.push(structuredClone(sceneRef.current));
    setScene(previous);
  }

  function redo() {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(structuredClone(sceneRef.current));
    setScene(next);
  }

  function placeItem(item: LibraryItem, x: number, z: number) {
    if (readOnly) return;
    const current = sceneRef.current;
    if (current.objects.length >= MAX_OBJECTS) {
      setError('La playa admite hasta 60 elementos.');
      return;
    }
    const selectedTank = current.objects.find((object) => object.id === selectedId && object.role === 'tank');
    const xPlaced = snap(x);
    const zPlaced = snap(z);
    if (!insidePlot(xPlaced, zPlaced)) {
      setMessage('Soltá la pieza dentro del predio marcado.');
      return;
    }
    const radioDraft = item.role === 'solar-wireless'
      ? createObject({ kind: item.kind, role: item.role, name: 'Transmisor', x: xPlaced, z: zPlaced })
      : null;
    const radioHost = radioDraft
      ? (selectedTank ?? transmitterHost(radioDraft, current.objects, current.connections))
      : undefined;
    if (item.role === 'solar-wireless' && !radioHost) {
      setMessage('Soltalo sobre el tanque al que va el transmisor, o elegí ese tanque antes.');
      return;
    }
    const host = radioHost ?? (item.role === 'probe' ? selectedTank : undefined);
    const object = createObject({
      kind: item.kind,
      role: item.role,
      name: nextName(current.objects, item.namePrefix),
      x: host ? host.x : xPlaced,
      z: host ? host.z : zPlaced,
      serviceKey: item.role,
      billing: item.billing,
      attachedTo: host ? host.id : null,
      rotation: host?.rotation,
      props: item.role === 'custom-service' ? { notes: 'Servicio adicional', billing: 'once' } : undefined,
    });
    const objects = radioHost
      ? current.objects.map((entry) => entry.id === radioHost.id ? { ...entry, props: { ...entry.props, comms: 'wireless-solar' as const } } : entry)
      : current.objects;
    commit({ ...current, objects: [...objects, object] });
    if (radioHost) setMessage(`Transmisor inalámbrico apoyado en el lomo de ${deviceLabel(radioHost)}.`);
    setSelectedId(object.id);
    setSelectedConnectionId(null);
    setArmed(null);
    setMobilePanel('inspector');
  }

  function acceptSuggestion(suggestion: Suggestion) {
    if (readOnly || suggestion.action === 'none') return;
    const current = sceneRef.current;
    const map: Record<string, string> = {
      'add-console': 'console',
      'add-controller': 'controller',
      'add-leak-console': 'leak-console',
      'add-fleet': 'fleet',
      'add-rfid': 'rfid',
      'add-cloud': 'cloud',
      'add-solar': 'solar',
    };
    if (suggestion.action === 'add-probe' && suggestion.targetId) {
      const installed = installProbe(current, suggestion.targetId, settings, products);
      commit({ ...installed.scene, dismissedSuggestionIds: [...installed.scene.dismissedSuggestionIds, suggestion.id] });
      setMessage(installed.message);
      setSelectedId(suggestion.targetId);
      return;
    }
    const libraryId = map[suggestion.action];
    const item = LIBRARY.find((entry) => entry.id === libraryId);
    if (!item) return;
    const office = current.objects.find((object) => object.role === 'office');
    const objects = [...current.objects];
    const quantity = suggestion.quantity ?? 1;
    for (let index = 0; index < quantity; index += 1) {
      if (objects.length >= MAX_OBJECTS) break;
      objects.push(createObject({
        kind: item.kind,
        role: item.role,
        name: nextName(objects, item.namePrefix),
        x: (office?.x ?? 0) + 2.2,
        z: (office?.z ?? 0) + index * 1.4,
        serviceKey: item.role,
        billing: item.billing,
      }));
    }
    commit({
      ...current,
      objects,
      dismissedSuggestionIds: [...current.dismissedSuggestionIds, suggestion.id],
    });
  }

  function dismissSuggestion(id: string) {
    commit({ ...sceneRef.current, dismissedSuggestionIds: [...sceneRef.current.dismissedSuggestionIds, id] });
  }

  function updateObject(next: SceneObject) {
    const current = sceneRef.current;
    commit(syncFuelLinks({
      ...current,
      objects: current.objects.map((object) => object.id === next.id ? next : object),
    }));
  }

  function removeSelected() {
    const current = sceneRef.current;
    if (readOnly) return;
    if (selectedConnectionId && !selectedId) {
      commit({ ...current, connections: current.connections.filter((connection) => connection.id !== selectedConnectionId) });
      setSelectedConnectionId(null);
      return;
    }
    if (!selectedId) return;
    const children = current.objects.filter((object) => object.attachedTo === selectedId);
    const removeChildren = children.length === 0 || window.confirm(`${children.map((child) => child.name).join(', ')} está instalado en este equipo. Aceptar lo elimina de la cotización. Cancelar lo deja suelto en la playa.`);
    commit(detachOrRemove(current, selectedId, removeChildren));
    setSelectedId(null);
  }

  function duplicateSelected() {
    const current = sceneRef.current;
    const object = current.objects.find((item) => item.id === selectedId);
    if (!object || readOnly || current.objects.length >= MAX_OBJECTS) return;
    const copy = createObject({
      ...object,
      name: nextName(current.objects, object.name.replace(/\s*\d+$/, '').trim() || 'C'),
      x: snap(object.x + 1.5),
      z: snap(object.z + 1.5),
      attachedTo: null,
    });
    commit({ ...current, objects: [...current.objects, copy] });
    setSelectedId(copy.id);
  }

  function rotateSelected(delta = Math.PI / 2) {
    const current = sceneRef.current;
    if (!selectedId || readOnly) return;
    commit(rotateObject(current, selectedId, delta));
  }

  function installOnSelected() {
    if (!selectedId || readOnly) return;
    const installed = installProbe(sceneRef.current, selectedId, settings, products);
    if (installed.scene !== sceneRef.current) commit(installed.scene);
    setMessage(installed.message);
  }

  function proposeLinks() {
    const proposal = suggestConnections(sceneRef.current, settings, products);
    if (proposal.links.length === 0) {
      setMessage(proposal.note);
      return;
    }
    setProposal(proposal.links);
    setMessage(`${proposal.note} No se agregan productos pagos.`);
  }

  function applyProposal() {
    if (!proposal) return;
    const current = sceneRef.current;
    if (current.connections.length + proposal.length > MAX_CONNECTIONS) {
      setError('No hay cupo para esas conexiones.');
      return;
    }
    commit({ ...current, connections: [...current.connections, ...proposal] });
    setProposal(null);
    setTool('select');
    setLinkFrom(null);
    setLinkType(null);
    setMessage('Conexiones sugeridas dibujadas. Revisá el color de cada indicador.');
  }

  function clearLink() {
    setLinkFrom(null);
    setLinkType(null);
    setLinkIndex(0);
    setPendingLink(null);
  }

  function originFor(id: string, targetId: string, type: ConnectionType | null) {
    const current = sceneRef.current;
    const object = current.objects.find((item) => item.id === id);
    const target = current.objects.find((item) => item.id === targetId);
    if (object?.role !== 'tank') return id;
    const probe = current.objects.find((item) => item.role === 'probe' && item.attachedTo === object.id);
    if (!probe) return id;
    const dataType = type === 'sensor' || type === 'wireless' || type === 'rs485' || type === 'ethernet' || type === 'wifi';
    const dataTarget = target?.role === 'console-telemetry' || target?.role === 'leak-console' || target?.role === 'cloud' || target?.kind === 'cloud';
    if (dataType || (type == null && dataTarget)) return probe.id;
    return id;
  }

  function beginConnect(fromId: string | null, type: ConnectionType | null) {
    setDiagram(false);
    setStory(null);
    setTool('connect');
    setLinkFrom(fromId);
    setLinkType(type);
    setLinkIndex(0);
    setPendingLink(null);
    setError(null);
    setMessage(fromId ? 'Ahora elegí dónde conectarlo.' : 'Elegí el equipo que querés conectar.');
  }

  function chooseConsole(tankId: string) {
    const current = sceneRef.current;
    const tank = current.objects.find((object) => object.id === tankId);
    const probe = current.objects.find((object) => object.role === 'probe' && object.attachedTo === tankId);
    const consoles = current.objects.filter((object) => object.role === 'console-telemetry');
    if (!tank || !probe) return;
    const type: ConnectionType = tank.props.comms === 'wireless' || tank.props.comms === 'wireless-solar' ? 'wireless' : 'sensor';
    if (consoles.length !== 1) {
      beginConnect(tankId, type);
      return;
    }
    const options = possibleLinks(probe.id, consoles[0].id, current, settings, products);
    const chosen = options.find((option) => option.type === type) ?? options[0];
    if (!chosen) {
      setError('Esa consola no admite la sonda con las reglas cargadas.');
      return;
    }
    setPendingLink({ fromId: probe.id, toId: consoles[0].id, type: chosen.type, hoseIndex: 0, status: chosen.status, message: chosen.message });
    setTool('connect');
    setLinkFrom(tankId);
    setLinkType(type);
    setDiagram(false);
    setError(null);
  }

  function commitConsole() {
    if (!paidAsk || readOnly) return;
    const item = LIBRARY.find((entry) => entry.id === 'console');
    const anchor = sceneRef.current.objects.find((object) => object.id === paidAsk);
    if (!item || sceneRef.current.objects.length >= MAX_OBJECTS) return;
    const object = createObject({
      kind: item.kind,
      role: item.role,
      name: nextName(sceneRef.current.objects, item.namePrefix),
      x: (anchor?.x ?? 0) - 3.2,
      z: (anchor?.z ?? 0) - 1.6,
      serviceKey: item.role,
      billing: item.billing,
    });
    commit({ ...sceneRef.current, objects: [...sceneRef.current.objects, object] });
    setPaidAsk(null);
    setSelectedId(object.id);
    setMessage('Consola agregada a la cotización. El precio sale del catálogo. Ahora podés conectarla.');
  }

  function playStory(kind: 'data' | 'fuel') {
    const steps = sceneRef.current.connections.filter((connection) => (kind === 'fuel' ? connection.type === 'process' : STORY_DATA.has(connection.type)));
    if (steps.length === 0) {
      setMessage(kind === 'fuel' ? 'No hay un abastecimiento configurado para recorrer.' : 'Todavía no hay un recorrido de información configurado.');
      return;
    }
    setDiagram(false);
    setStory(kind);
    setStoryStep(0);
    setTool('select');
    clearLink();
  }

  function focusRole(role: string) {
    const objects = scene.objects.filter((object) => object.role === role || (role === 'dispenser' && object.role === 'loading-point'));
    if (objects.length === 0) {
      setMessage('No hay equipos de ese tipo en la playa.');
      return;
    }
    setDiagram(false);
    apiRef.current?.frame(frameExtents(objects));
  }

  function fitScene() {
    setDiagram(false);
    apiRef.current?.frame(frameExtents(scene.objects.filter((object) => !object.attachedTo)));
  }

  function hoseFor(fromId: string, toId: string, type: ConnectionType, targetIndex: number) {
    const current = sceneRef.current;
    const fromObject = current.objects.find((object) => object.id === fromId);
    const toObject = current.objects.find((object) => object.id === toId);
    const fromIsDispenser = fromObject?.role === 'dispenser' || fromObject?.role === 'loading-point';
    const toIsDispenser = toObject?.role === 'dispenser' || toObject?.role === 'loading-point';
    if (type === 'process') {
      if (fromIsDispenser) return linkIndex;
      if (toIsDispenser) return targetIndex;
    }
    return linkIndex;
  }

  function placeConnection(fromId: string, toId: string, type: ConnectionType, hoseIndex: number | null) {
    const current = sceneRef.current;
    if (current.connections.some((connection) => connection.fromId === fromId && connection.toId === toId && connection.type === type)) {
      setError('Esa conexión ya existe.');
      return;
    }
    if (current.connections.length >= MAX_CONNECTIONS) {
      setError('No hay cupo para esa conexión.');
      return;
    }
    const connection: SceneConnection = { id: uid(), fromId, toId, type, layer: connectionLayer(type), hoseIndex };
    const trial = { ...current, connections: [...current.connections, connection] };
    const finding = assessConnection(connection, trial, settings, products);
    if (finding.status === 'incompatible') {
      setError(finding.message);
      return;
    }
    commit(trial);
    setSelectedConnectionId(connection.id);
    setSelectedId(null);
    setGlowId(connection.id);
    window.setTimeout(() => setGlowId((current) => (current === connection.id ? null : current)), 1700);
    setMessage(finding.status === 'compatible' ? 'Conexión agregada a la configuración.' : finding.message);
    clearLink();
    setTool('select');
  }

  function completeLink(targetId: string, targetPort?: ScenePort) {
    if (!linkFrom || readOnly || targetId === linkFrom) return;
    const preferredType = linkType ?? targetPort?.type ?? null;
    const fromId = originFor(linkFrom, targetId, preferredType);
    if (fromId === targetId) return;
    const options = possibleLinks(fromId, targetId, sceneRef.current, settings, products);
    const pool = preferredType ? options.filter((option) => option.type === preferredType) : options;
    if (pool.length === 0) {
      setError('No hay una conexión técnicamente posible entre esos equipos.');
      return;
    }
    const chosen = pool.find((option) => option.status === 'compatible')
      ?? LINK_ORDER.map((type) => pool.find((option) => option.type === type)).find((option) => option)
      ?? pool[0];
    setPendingLink({
      fromId,
      toId: targetId,
      type: chosen.type,
      hoseIndex: hoseFor(fromId, targetId, chosen.type, targetPort?.index ?? 0),
      status: chosen.status,
      message: chosen.message,
    });
    setError(null);
  }

  function handlePort(id: string, port: ScenePort) {
    if (readOnly) return;
    setSelectedId(id);
    setSelectedConnectionId(null);
    setDiagram(false);
    if (linkFrom && linkFrom !== id) {
      completeLink(id, port);
      return;
    }
    setTool('connect');
    setLinkFrom(id);
    setLinkType(port.type);
    setLinkIndex(port.index);
    setPendingLink(null);
    setError(null);
    setMessage('Ahora elegí dónde conectarlo.');
  }

  async function persist(action: 'save' | 'pdf', person: Customer) {
    const problem = validateCustomer(person);
    if (problem) {
      setError(problem);
      setCustomerOpen(true);
      return;
    }
    if (products.length === 0) {
      setError('El catálogo todavía no cargó. Los precios tienen que salir de ahí, así que esperá un momento y volvé a intentar.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const captured = apiRef.current?.capture();
      const previewImage = captured ? await shrinkCapture(captured) : undefined;
      const saved = await saveQuote({
        scene: sceneRef.current,
        customer: person,
        settings,
        products,
        existing: quote?.recoveryCode ? quote : null,
        previewImage,
        asRevision: true,
      });
      setQuote(saved);
      setCustomer(person);
      setReadOnly(false);
      loadedKey.current = `e:${saved.recoveryCode}`;
      setParams({ editar: saved.recoveryCode });
      const localOnly = (saved as StoredQuote & { cloud?: boolean }).cloud === false;
      setMessage(localOnly
        ? `Guardamos ${saved.quoteNumber} en este navegador. Código: ${saved.recoveryCode}`
        : `Guardamos ${saved.quoteNumber}, revisión ${saved.revision}. Código de edición: ${saved.recoveryCode}`);
      setError(null);
      if (action === 'pdf') {
        const findings = analyzeInstallation(saved.scene, settings, products).findings;
        await downloadQuotePdf(saved, findings, window.location.origin);
      }
    } catch (saveError) {
      setError(friendlyError(saveError, 'No se pudo guardar el proyecto.'));
    } finally {
      setBusy(false);
      setCustomerOpen(false);
      setPendingAction(null);
    }
  }

  function requestPersist(action: 'save' | 'pdf') {
    if (readOnly) {
      setError('Esta es una vista de consulta. Ingresá el código de recuperación para modificarla.');
      setRecoverOpen(true);
      return;
    }
    const problem = validateCustomer(customer);
    if (problem) {
      setPendingAction(action);
      setCustomerOpen(true);
      return;
    }
    void persist(action, customer);
  }

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        removeSelected();
      } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
        event.preventDefault();
        duplicateSelected();
      } else if (event.key.toLowerCase() === 'r' || event.key === ']') {
        rotateSelected(event.shiftKey || event.key === '[' ? -Math.PI / 2 : Math.PI / 2);
      } else if (event.key === '[') {
        rotateSelected(-Math.PI / 2);
      } else if (event.key.toLowerCase() === 'q') {
        rotateSelected(-Math.PI / 2);
      } else if (event.key.toLowerCase() === 'e') {
        rotateSelected(Math.PI / 2);
      } else if (event.key === 'Escape') {
        setLinkFrom(null);
        setLinkType(null);
        setLinkIndex(0);
        setPendingLink(null);
        setPaidAsk(null);
        setStory(null);
        setTool('select');
        setArmed(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const counts = {
    tanks: scene.objects.filter((object) => object.role === 'tank').length,
    dispensers: scene.objects.filter((object) => object.role === 'dispenser' || object.role === 'loading-point').length,
    probes: scene.objects.filter((object) => object.role === 'probe').reduce((sum, object) => sum + object.quantity, 0),
    equipment: scene.objects.filter((object) => !['tank', 'dispenser', 'loading-point', 'office', 'fuel-pump', 'flow-meter', 'mechanical-meter'].includes(object.role)).length,
    warnings: analysis.findings.filter((finding) => finding.status === 'pending' || finding.status === 'incompatible').length,
  };

  return (
      <div className="relative h-[calc(100dvh-5rem)] mt-20 flex flex-col bg-[#e7f3e4] text-[#1c3324]">
      <header className="h-12 shrink-0 bg-[#fffaf3] border-b border-[#efe4d2] px-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-emerald-700">
            <ArrowLeft className="w-3.5 h-3.5" /> Sitio
          </Link>
          <strong className="truncate text-sm">Modo construir</strong>
          {quote && <span className="hidden md:inline text-[11px] text-stone-400">{quote.quoteNumber}</span>}
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="p-2 rounded-full hover:bg-emerald-50" onClick={undo} title="Deshacer"><Undo2 className="w-4 h-4" /></button>
          <button type="button" className="p-2 rounded-full hover:bg-emerald-50" onClick={redo} title="Rehacer"><Redo2 className="w-4 h-4" /></button>
          <button type="button" className="ml-1 px-3 py-1.5 text-sm rounded-full border border-[#efe4d2] bg-white" onClick={() => setRecoverOpen(true)}>Recuperar</button>
        </div>
      </header>

      {(message || error || tool === 'connect' || armed) && !pendingLink && (
        <div className={`px-4 py-2 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-sky-50 text-sky-950'}`}>
          {error ?? message ?? (tool === 'connect' ? (linkFrom ? 'Ahora elegí la otra pieza.' : 'Elegí la primera pieza para conectar.') : armed ? `Colocá ${armed.title} en la playa.` : '')}
          <button type="button" className="ml-3 underline" onClick={() => { setError(null); setMessage(null); setArmed(null); clearLink(); setTool('select'); }}>{tool === 'connect' ? 'Cancelar' : 'Cerrar'}</button>
        </div>
      )}

      <div className="flex-1 min-h-0 flex">
        <div className={`${mobilePanel === 'library' ? 'block' : 'hidden'} lg:block w-full lg:w-60 shrink-0`}>
          <LibraryPanel armedId={armed?.id ?? null} onArm={(item) => { setArmed(item); setMobilePanel(null); }} />
        </div>
        <div className={`${mobilePanel ? 'hidden lg:block' : 'block'} flex-1 min-w-0 relative`}>
          <div className={diagram ? 'hidden' : 'absolute inset-0'}>
          <InstallationCanvas
            scene={scene}
            selectedId={selectedId}
            selectedConnectionId={selectedConnectionId}
            armed={Boolean(armed) && !readOnly}
            ghostKind={armed && !readOnly ? armed.kind : null}
            linkFrom={tool === 'connect' ? linkFrom : null}
            linkType={linkType}
            linkIndex={linkIndex}
            layerFilter={layerFilter}
            snapGrid={snapGrid}
            allowDrag={tool !== 'connect' && !readOnly}
            reports={new Map()}
            apiRef={apiRef}
            focusId={storyLink ? null : tool === 'connect' ? linkFrom : selectedId}
            pinIds={storyLink ? [storyLink.id] : selectedConnectionId ? [selectedConnectionId] : []}
            litIds={litIds}
            hints={linkHints}
            connectMode={tool === 'connect'}
            pulseId={glowId ?? storyLink?.id ?? null}
            badges={badges}
            actions={selectedId && !readOnly ? {
              onMove: () => { setTool('move'); setMessage('Arrastrá la pieza por la playa.'); },
              onRotate: () => rotateSelected(Math.PI / 2),
              onDuplicate: duplicateSelected,
              onRemove: removeSelected,
              onConnect: () => beginConnect(selectedId, null),
              onEdit: () => { setSheetOpen(true); setMobilePanel('inspector'); },
            } : undefined}
            onSelect={(id) => {
              const picked = sceneRef.current.objects.find((object) => object.id === id);
              const resolved = picked?.role === 'probe' && picked.attachedTo ? picked.attachedTo : id;
              if (tool === 'connect' && resolved) {
                if (!linkFrom) {
                  setLinkFrom(resolved);
                  setSelectedId(resolved);
                  setLinkType(null);
                  setMessage('Ahora elegí dónde conectarlo.');
                } else completeLink(resolved);
                return;
              }
              setSelectedId(resolved);
              setSelectedConnectionId(null);
              if (!resolved) setSheetOpen(false);
              if (resolved) setMobilePanel('inspector');
            }}
            onSelectConnection={(id) => { setSelectedConnectionId(id); setSelectedId(null); }}
            onDragStart={() => { dragOrigin.current = structuredClone(sceneRef.current); }}
            onMove={(id, x, z) => {
              if (readOnly) return;
              setScene((current) => ({
                ...current,
                objects: current.objects.map((object) => object.id === id || object.attachedTo === id ? { ...object, x, z } : object),
              }));
            }}
            onMoveEnd={() => {
              if (dragOrigin.current) {
                history.current.push(dragOrigin.current);
                future.current = [];
                dragOrigin.current = null;
              }
            }}
            onRotate={(id, rotation) => {
              if (readOnly) return;
              setScene((current) => ({
                ...current,
                objects: current.objects.map((object) => object.id === id ? { ...object, rotation } : object),
              }));
            }}
            onPlace={(x, z) => { if (armed) placeItem(armed, x, z); }}
            onDropItem={(itemId, x, z) => {
              const item = LIBRARY.find((entry) => entry.id === itemId);
              if (item) placeItem(item, x, z);
            }}
            onLinkTarget={completeLink}
            onPort={handlePort}
          />
          </div>
          {diagram && (
            <div className="absolute inset-0">
              <TopologyView
                scene={scene}
                selectedId={selectedId}
                selectedConnectionId={selectedConnectionId}
                onSelect={(id) => { setSelectedId(id); setSelectedConnectionId(null); }}
                onSelectConnection={(id) => { setSelectedConnectionId(id); setSelectedId(null); }}
              />
            </div>
          )}
          {!diagram && !selected && !armed && tool !== 'connect' && !story && scene.objects.every((object) => Boolean(object.attachedTo)) && (
            <div className="absolute left-3 top-3 z-10 w-64 rounded-3xl bg-[#fffaf3]/95 border border-[#efe4d2] shadow-lg p-4">
              <p className="text-base font-semibold">Empezá a construir</p>
              <p className="text-sm text-stone-600 mt-1">Elegí una pieza y colocala en la playa.</p>
            </div>
          )}
          {!diagram && selected && tool !== 'connect' && !pendingLink && !paidAsk && !story && (
            <InspectCard
              object={selected}
              scene={scene}
              findings={analysis.findings}
              readOnly={readOnly}
              onEdit={() => { setSheetOpen(true); setMobilePanel('inspector'); }}
              onConnections={() => {
                setLayerFilter('all');
                setScene((current) => ({ ...current, showConnections: false }));
                apiRef.current?.focus(selected.x, selected.z);
              }}
              onFocus={() => apiRef.current?.focus(selected.x, selected.z)}
              onInstallProbe={installOnSelected}
              onConnect={() => {
                const wireless = selected.props.comms === 'wireless' || selected.props.comms === 'wireless-solar';
                beginConnect(selected.id, selected.role === 'tank' ? (wireless ? 'wireless' : 'sensor') : null);
              }}
              onChooseConsole={() => chooseConsole(selected.id)}
              onAskConsole={() => setPaidAsk(selected.id)}
              onChangeObject={updateObject}
            />
          )}
          {proposal && (
            <div className="absolute left-1/2 top-3 -translate-x-1/2 z-20 bg-white border border-gray-200 shadow-lg p-3 w-80">
              <p className="text-xs font-bold text-[#011832]">¿Dibujar {proposal.length} conexión(es)?</p>
              <p className="text-[11px] text-gray-500 mt-1">Solo enlaza equipos que ya están en la playa. No agrega productos pagos.</p>
              <div className="flex gap-2 mt-3">
                <button type="button" className="bg-[#011832] text-white text-[10px] font-bold uppercase px-3 py-1.5" onClick={applyProposal}>Confirmar</button>
                <button type="button" className="border border-gray-200 text-[10px] font-bold uppercase px-3 py-1.5" onClick={() => setProposal(null)}>Cancelar</button>
              </div>
            </div>
          )}
          {pendingLink && (
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 z-20 w-80 rounded-3xl bg-[#fffaf3] border border-[#efe4d2] shadow-xl p-4">
              <p className="text-sm font-semibold">¿Las conectamos?</p>
              <dl className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between gap-3"><dt className="text-gray-500">Origen</dt><dd className="font-medium">{displayName(scene, pendingLink.fromId)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-gray-500">Destino</dt><dd className="font-medium">{displayName(scene, pendingLink.toId)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-gray-500">Tipo</dt><dd className="font-medium">{CONNECTION_LABELS[pendingLink.type]}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-gray-500">Estado</dt><dd className="font-medium">{pendingLink.status === 'compatible' ? 'Compatible' : 'Pendiente de verificación'}</dd></div>
              </dl>
              <p className="text-[11px] text-gray-500 mt-2">{pendingLink.message}</p>
              <div className="flex gap-2 mt-3">
                <button type="button" className="bg-[#011832] text-white text-[10px] font-bold uppercase px-3 py-1.5" onClick={() => placeConnection(pendingLink.fromId, pendingLink.toId, pendingLink.type, pendingLink.hoseIndex)}>Conectar</button>
                <button type="button" className="border border-gray-200 text-[10px] font-bold uppercase px-3 py-1.5" onClick={() => setPendingLink(null)}>Cancelar</button>
              </div>
            </div>
          )}
          {paidAsk && (
            <div className="absolute left-3 top-3 z-20 w-80 bg-white border border-amber-400 shadow-lg p-3">
              <p className="text-sm font-bold">Esta consola se agrega a la cotización.</p>
              <p className="text-[11px] text-gray-600 mt-1">El precio sale del catálogo. No se incorpora hasta que confirmes.</p>
              <div className="flex gap-2 mt-3">
                <button type="button" className="bg-[#011832] text-white text-[10px] font-bold uppercase px-3 py-1.5" onClick={commitConsole}>Agregar consola</button>
                <button type="button" className="border border-gray-200 text-[10px] font-bold uppercase px-3 py-1.5" onClick={() => setPaidAsk(null)}>Cancelar</button>
              </div>
            </div>
          )}
          {storyLink && (
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 z-20 w-96 max-w-[92%] bg-white border border-gray-200 shadow-lg p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-700">{story === 'fuel' ? 'Recorrido del combustible' : 'Cómo funciona'}</p>
              <p className="text-sm mt-1">{storyLink.text}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                {story !== 'fuel' && <button type="button" className="border border-gray-200 text-[10px] font-bold uppercase px-2 py-1" onClick={() => playStory('fuel')}>Recorrido del combustible</button>}
                {story === 'fuel' && <button type="button" className="border border-gray-200 text-[10px] font-bold uppercase px-2 py-1" onClick={() => playStory('data')}>Ver información</button>}
                <button type="button" className="text-[10px] font-bold uppercase text-gray-500" onClick={() => setStory(null)}>Cerrar</button>
              </div>
            </div>
          )}
          {!diagram && !story && !pendingLink && (
            <div className="absolute left-1/2 bottom-4 -translate-x-1/2 z-20 flex items-center gap-2">
              <button type="button" className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${tool === 'connect' ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-800'}`} onClick={() => beginConnect(null, null)}>
                <Plug className="w-4 h-4" /> Conectar
              </button>
              <button type="button" className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${story === 'data' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-700'}`} onClick={() => playStory('data')}>
                <Play className="w-4 h-4" /> Cómo funciona
              </button>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-lg" onClick={fitScene}>
                <ZoomIn className="w-4 h-4" /> Ajustar
              </button>
              <div className="relative">
                <button type="button" className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ${moreOpen ? 'bg-emerald-700 text-white' : 'bg-white text-stone-700'}`} onClick={() => setMoreOpen((value) => !value)}>
                  <SlidersHorizontal className="w-4 h-4" /> Más
                </button>
                {moreOpen && (
                  <div className="absolute bottom-12 right-0 w-56 rounded-2xl bg-[#fffaf3] border border-[#efe4d2] shadow-xl p-2 text-sm">
                    <button type="button" className="w-full text-left rounded-xl px-3 py-2 hover:bg-emerald-50" onClick={() => { setDiagram(false); setStory(null); setLayerFilter('all'); setScene((current) => ({ ...current, showConnections: !current.showConnections })); }}>Ver relaciones</button>
                    <button type="button" className="w-full text-left rounded-xl px-3 py-2 hover:bg-emerald-50" onClick={() => { setDiagram((value) => !value); setStory(null); setMoreOpen(false); }}><Network className="w-3.5 h-3.5 inline mr-1" />Topología</button>
                    <button type="button" className="w-full text-left rounded-xl px-3 py-2 hover:bg-emerald-50" onClick={() => { proposeLinks(); setMoreOpen(false); }}>Sugerir vínculos</button>
                    <button type="button" className="w-full text-left rounded-xl px-3 py-2 hover:bg-emerald-50" onClick={() => { if (selectedConnectionId) removeSelected(); else setMessage('Tocá una relación iluminada para quitarla.'); }}>Quitar relación</button>
                    <button type="button" className="w-full text-left rounded-xl px-3 py-2 hover:bg-emerald-50" onClick={() => setSnapGrid(!snapGrid)}>{snapGrid ? 'Ocultar grilla' : 'Mostrar grilla'}</button>
                    <button type="button" className="w-full text-left rounded-xl px-3 py-2 hover:bg-emerald-50" onClick={() => focusRole('tank')}>Ver tanques</button>
                    <button type="button" className="w-full text-left rounded-xl px-3 py-2 hover:bg-emerald-50" onClick={() => focusRole('dispenser')}>Ver surtidores</button>
                    <button type="button" className="w-full text-left rounded-xl px-3 py-2 hover:bg-emerald-50" onClick={() => focusRole('office')}>Ver oficina</button>
                    <div className="mt-1 grid grid-cols-2 gap-1">
                      {(['fuel', 'telemetry', 'control', 'network'] as LayerFilter[]).map((filter) => (
                        <button key={filter} type="button" className={`rounded-xl px-2 py-1.5 text-xs ${layerFilter === filter ? 'bg-emerald-600 text-white' : 'bg-white'}`} onClick={() => { setDiagram(false); setLayerFilter(layerFilter === filter ? 'all' : filter); }}>
                          {filter === 'fuel' ? 'Combustible' : filter === 'telemetry' ? 'Nivel' : filter === 'control' ? 'Control' : 'Red'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className={`${mobilePanel === 'inspector' ? 'block' : 'hidden'} ${sheetOpen ? 'lg:block' : 'lg:hidden'} w-full lg:w-72 shrink-0`}>
          <div className="hidden lg:flex items-center justify-between px-3 py-2 border-b border-sky-100 bg-white">
            <p className="text-[11px] font-bold uppercase tracking-widest text-sky-600">Ficha</p>
            <button type="button" className="text-[11px] text-slate-500" onClick={() => setSheetOpen(false)}>Cerrar</button>
          </div>
          <Inspector
            object={selected}
            connection={selectedConnection}
            connectionMessage={connectionMessage}
            objects={scene.objects}
            scene={scene}
            suggestions={analysis.suggestions}
            readOnly={readOnly}
            onChangeObject={updateObject}
            onDelete={removeSelected}
            onDuplicate={duplicateSelected}
            onRotate={() => rotateSelected(Math.PI / 2)}
            onInstall={installOnSelected}
            onFocus={() => {
              if (!selected) return;
              apiRef.current?.focus(selected.x, selected.z);
            }}
            onStartLink={() => {
              if (!selectedId) return;
              beginConnect(selectedId, null);
              setMobilePanel(null);
            }}
            onDeleteConnection={() => {
              if (!selectedConnectionId) return;
              commit({ ...sceneRef.current, connections: sceneRef.current.connections.filter((connection) => connection.id !== selectedConnectionId) });
              setSelectedConnectionId(null);
            }}
            onAccept={acceptSuggestion}
            onDismiss={dismissSuggestion}
          />
        </div>
      </div>

      <div className="lg:hidden flex border-t border-gray-200 bg-white">
        <button type="button" className="flex-1 py-2 text-[10px] font-bold uppercase" onClick={() => setMobilePanel(mobilePanel === 'library' ? null : 'library')}>Equipos</button>
        <button type="button" className="flex-1 py-2 text-[10px] font-bold uppercase" onClick={() => setMobilePanel(null)}>Playa</button>
        <button type="button" className="flex-1 py-2 text-[10px] font-bold uppercase" onClick={() => setMobilePanel(mobilePanel === 'inspector' ? null : 'inspector')}>Datos</button>
      </div>

      <StatusBar
        {...counts}
        bom={analysis.bom}
        busy={busy}
        readOnly={readOnly}
        onSave={() => requestPersist('save')}
        onQuote={() => requestPersist('pdf')}
      />

      {!started && (
        <div className="absolute inset-0 z-30 bg-[#011832]/80 flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full p-6 md:p-8 shadow-2xl">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">C.E.S.T.I.</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-2">Diseñá tu instalación con C.E.S.T.I.</h1>
            <p className="text-gray-600 mt-3">Armá tu estación de servicio, instalación agroindustrial o sistema de abastecimiento. Nosotros calculamos los equipos necesarios.</p>
            <div className="grid sm:grid-cols-2 gap-3 mt-6">
              {TEMPLATES.map((template) => (
                <button key={template.id} type="button" className="text-left border border-gray-200 p-4 hover:border-red-600" onClick={() => {
                  const next = templateScene(template.id);
                  setScene(next);
                  setStarted(true);
                  window.setTimeout(() => apiRef.current?.frame(frameExtents(next.objects.filter((object) => !object.attachedTo))), 60);
                }}>
                  <span className="block font-bold">{template.title}</span>
                  <span className="block text-sm text-gray-500 mt-1">{template.text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {customerOpen && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <form
            className="bg-white max-w-lg w-full p-6 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const next: Customer = {
                name: String(form.get('name') || ''),
                company: String(form.get('company') || ''),
                email: String(form.get('email') || ''),
                phone: String(form.get('phone') || ''),
                location: String(form.get('location') || ''),
                activity: String(form.get('activity') || ''),
                notes: String(form.get('notes') || ''),
              };
              setCustomer(next);
              void persist(pendingAction ?? 'save', next);
            }}
          >
            <h2 className="text-xl font-bold">Datos para la cotización</h2>
            <p className="text-xs text-gray-500">Contacto de C.E.S.T.I.: {COMPANY.email} · {COMPANY.phone}</p>
            <input name="name" required defaultValue={customer.name} placeholder="Nombre y apellido o razón social" className="w-full border border-gray-200 px-3 py-2 text-sm" />
            <input name="company" defaultValue={customer.company} placeholder="Empresa (opcional)" className="w-full border border-gray-200 px-3 py-2 text-sm" />
            <input name="email" type="email" required defaultValue={customer.email} placeholder="Correo electrónico" className="w-full border border-gray-200 px-3 py-2 text-sm" />
            <input name="phone" required defaultValue={customer.phone} placeholder="Teléfono" className="w-full border border-gray-200 px-3 py-2 text-sm" />
            <input name="location" defaultValue={customer.location} placeholder="Ubicación de la instalación (opcional)" className="w-full border border-gray-200 px-3 py-2 text-sm" />
            <select name="activity" required defaultValue={customer.activity} className="w-full border border-gray-200 px-3 py-2 text-sm">
              <option value="">Tipo de actividad</option>
              {ACTIVITIES.map((activity) => <option key={activity.id} value={activity.id}>{activity.label}</option>)}
            </select>
            <textarea name="notes" defaultValue={customer.notes} placeholder="Observaciones" className="w-full border border-gray-200 px-3 py-2 text-sm" rows={3} />
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-3 py-2 text-xs font-bold uppercase" onClick={() => setCustomerOpen(false)}>Cancelar</button>
              <button type="submit" className="px-3 py-2 bg-red-600 text-white text-xs font-bold uppercase">{busy ? 'Guardando…' : 'Continuar'}</button>
            </div>
          </form>
        </div>
      )}

      {recoverOpen && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center p-4">
          <form
            className="bg-white max-w-md w-full p-6"
            onSubmit={async (event) => {
              event.preventDefault();
              const code = recoverCode.trim();
              setBusy(true);
              setError(null);
              try {
                const privateQuote = await loadPrivateQuote(code);
                const publicQuote = privateQuote ? null : await loadPublicQuote(code);
                const loaded = privateQuote ?? publicQuote;
                if (!loaded) {
                  setError('Ese código no corresponde a una cotización guardada.');
                  return;
                }
                setQuote(loaded);
                setScene(loaded.scene);
                setCustomer(loaded.customer ?? emptyCustomer());
                setStarted(true);
                setReadOnly(!privateQuote);
                loadedKey.current = privateQuote ? `e:${code}` : `v:${code}`;
                setParams(privateQuote ? { editar: code } : { ver: loaded.quoteNumber });
                setRecoverOpen(false);
                setMessage(privateQuote ? 'Proyecto recuperado. Podés modificarlo: al guardar se crea una revisión nueva.' : 'Abrimos la consulta. El código público no habilita la edición.');
              } catch (loadError) {
                setError(friendlyError(loadError, 'No se pudo recuperar.'));
              } finally {
                setBusy(false);
              }
            }}
          >
            <h2 className="text-xl font-bold">Recuperar cotización</h2>
            <p className="text-sm text-gray-500 mt-2">El código de recuperación abre el proyecto para editarlo. El número público CT- solo permite consultarlo.</p>
            <input value={recoverCode} onChange={(event) => setRecoverCode(event.target.value)} className="w-full border border-gray-200 px-3 py-2 text-sm mt-4" placeholder="RC-… o CT-…" />
            <div className="flex gap-2 justify-end mt-4">
              <button type="button" className="px-3 py-2 text-xs font-bold uppercase" onClick={() => setRecoverOpen(false)}>Cancelar</button>
              <button type="submit" className="px-3 py-2 bg-[#011832] text-white text-xs font-bold uppercase">Abrir</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
