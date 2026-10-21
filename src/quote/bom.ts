import type { Product } from '../types';
import { resolveRole } from './settings';
import { catalogPrice, fingerprintProducts } from './specs';
import type { BomLine, BomResult, SceneObject, SceneState, TechnicalSettings } from './types';

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function probeOffer(tank: SceneObject | undefined): { key: string; name: string; price: number; description: string } {
  const wireless = tank?.props.comms === 'wireless' || tank?.props.comms === 'wireless-solar';
  if (wireless) {
    return {
      key: 'probe:wireless',
      name: 'Sonda de telemedición con módulo inalámbrico',
      price: 850,
      description: 'Incluye el módulo inalámbrico.',
    };
  }
  return {
    key: 'probe:wired',
    name: 'Sonda de telemedición cableada',
    price: 650,
    description: 'Sonda cableada hacia la consola.',
  };
}

function line(partial: BomLine): BomLine {
  return partial;
}

export function buildBom(
  scene: SceneState,
  settings: TechnicalSettings,
  products: Product[],
  overrides: Record<string, number> = {},
): BomResult {
  const lines: BomLine[] = [];

  const clientGear = new Set(['tank', 'dispenser', 'loading-point', 'office', 'fuel-pump', 'flow-meter', 'mechanical-meter']);
  scene.objects
    .filter((object) => clientGear.has(object.role))
    .forEach((object) => {
      const detail = object.role === 'tank'
        ? [object.props.capacityLiters ? `${object.props.capacityLiters} L` : 'capacidad pendiente', object.props.heightMm ? `${object.props.heightMm} mm` : 'altura pendiente', object.props.product || object.props.customProduct || 'producto sin definir']
        : object.role === 'office'
          ? ['edificio del cliente']
          : object.role === 'fuel-pump'
            ? ['bomba del cliente']
            : object.role === 'flow-meter'
              ? ['caudalímetro del cliente']
              : object.role === 'mechanical-meter'
                ? ['aforador mecánico del cliente']
                : [object.props.brand || 'marca sin definir', object.props.hoseCount ? `${object.props.hoseCount} mangueras` : 'mangueras sin definir'];
      lines.push(line({
        key: `infra:${object.id}`,
        section: 'infrastructure',
        productId: null,
        sku: null,
        name: object.name,
        description: detail.filter(Boolean).join(' · '),
        quantity: 1,
        unitPrice: null,
        billing: 'none',
        priceOrigin: 'none',
        sourceObjectIds: [object.id],
      }));
    });

  const groups = new Map<string, { object: SceneObject; qty: number; ids: string[]; product: Product | null; bindingLabel: string; fixedPrice: number | null; fixedName: string | null; fixedDescription: string | null }>();

  scene.objects.forEach((object) => {
    if (clientGear.has(object.role)) return;
    if (object.role === 'solar-wireless') return;
    if (object.role === 'probe') {
      const tank = scene.objects.find((item) => item.id === object.attachedTo);
      const offer = probeOffer(tank);
      const current = groups.get(offer.key);
      const qty = object.quantity;
      if (current) {
        current.qty += qty;
        current.ids.push(object.id);
      } else {
        groups.set(offer.key, {
          object,
          qty,
          ids: [object.id],
          product: null,
          bindingLabel: offer.name,
          fixedPrice: offer.price,
          fixedName: offer.name,
          fixedDescription: offer.description,
        });
      }
      return;
    }

    const resolved = resolveRole(object.role, settings, products);
    const product = resolved.product;
    const key = product ? `product:${product.id}` : `role:${object.role}`;
    const current = groups.get(key);
    if (current) {
      current.qty += object.quantity;
      current.ids.push(object.id);
    } else {
      groups.set(key, {
        object,
        qty: object.quantity,
        ids: [object.id],
        product,
        bindingLabel: resolved.binding?.label ?? object.name,
        fixedPrice: null,
        fixedName: null,
        fixedDescription: null,
      });
    }
  });

  groups.forEach((group, key) => {
    const binding = resolveRole(group.object.role === 'probe' ? 'probe-rigid' : group.object.role, settings, products).binding;
    const section = group.object.role === 'probe'
      ? 'equipment'
      : binding?.section ?? (group.object.kind === 'service' || group.object.kind === 'cloud' || group.object.kind === 'receiver' ? 'service' : 'equipment');
    const catalog = group.fixedPrice ?? catalogPrice(group.product);
    const override = typeof overrides[key] === 'number' && Number.isFinite(overrides[key]) ? overrides[key] : null;
    const unitPrice = override ?? catalog;
    const billing = section === 'service'
      ? (binding?.billing === 'recurring' || group.object.props.billing === 'recurring' ? 'recurring' : 'once')
      : 'once';
    lines.push(line({
      key,
      section,
      productId: group.product?.id ?? null,
      sku: group.product?.id ?? null,
      name: group.fixedName ?? group.product?.name ?? group.bindingLabel,
      description: group.fixedDescription ?? (group.product?.description ?? binding?.notes ?? 'Sin ficha de catálogo vinculada.'),
      quantity: group.qty,
      unitPrice,
      billing,
      priceOrigin: override != null ? 'admin' : catalog != null ? 'catalog' : 'unpriced',
      sourceObjectIds: group.ids,
    }));
  });

  const commercial = lines.filter((item) => item.section !== 'infrastructure');
  const onceSubtotal = roundMoney(commercial.filter((item) => item.billing !== 'recurring' && item.unitPrice != null).reduce((sum, item) => sum + item.unitPrice! * item.quantity, 0));
  const recurringSubtotal = roundMoney(commercial.filter((item) => item.billing === 'recurring' && item.unitPrice != null).reduce((sum, item) => sum + item.unitPrice! * item.quantity, 0));
  const tax = settings.taxPercent == null ? null : roundMoney(onceSubtotal * (settings.taxPercent / 100));
  const pendingCount = commercial.filter((item) => item.unitPrice == null).length;

  return {
    lines,
    onceSubtotal,
    recurringSubtotal,
    tax,
    totalPriced: roundMoney(onceSubtotal + (tax ?? 0)),
    pendingCount,
    currency: settings.currency || 'USD',
    taxPercent: settings.taxPercent,
    validityDays: settings.validityDays,
    catalogFingerprint: fingerprintProducts(products),
  };
}
