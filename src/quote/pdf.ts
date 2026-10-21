import { jsPDF } from 'jspdf';
import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import type { Product } from '../types';
import { COMPANY, installationLabel } from './company';
import { money } from './specs';
import { productsWithDocs } from './technicalDocs';
import { ACTIVITIES, QUOTE_STATUSES, type Finding, type StoredQuote } from './types';

const NAVY: [number, number, number] = [1, 24, 50];
const RED: [number, number, number] = [220, 38, 38];
const INK: [number, number, number] = [31, 41, 55];
const MUTED: [number, number, number] = [107, 114, 128];

function activityLabel(id: string | undefined): string {
  return ACTIVITIES.find((item) => item.id === id)?.label ?? (id || 'Sin dato');
}

function statusLabel(id: string): string {
  return QUOTE_STATUSES.find((item) => item.id === id)?.label ?? id;
}

export function technicalDocsForQuote(quote: StoredQuote, products: Product[]): Product[] {
  return productsWithDocs(quote, products);
}

function asDataUrl(product: Product): string {
  const data = (product.technicalDoc || '').replace(/\s/g, '');
  if (data.startsWith('data:')) return product.technicalDoc || '';
  if (product.technicalDocKind === 'pdf') return `data:application/pdf;base64,${data}`;
  return `data:image/jpeg;base64,${data}`;
}
function dataUrlBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function plain(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7E]/g, '');
}

async function appendTechnicalDocs(blob: Blob, documents: Product[]): Promise<Blob> {
  if (documents.length === 0) return blob;
  try {
    const main = await PDFDocument.load(await blob.arrayBuffer());
    for (const product of documents) {
      const data = asDataUrl(product);
      if (!data.startsWith('data:')) continue;
      try {
        if (product.technicalDocKind === 'pdf') {
          const cover = main.addPage([595.28, 841.89]);
          cover.drawText('Documentacion tecnica', { x: 40, y: 780, size: 16 });
          cover.drawText(plain(product.name).slice(0, 80), { x: 40, y: 752, size: 12 });
          const extra = await PDFDocument.load(dataUrlBytes(data), { ignoreEncryption: true });
          const copied = await main.copyPages(extra, extra.getPageIndices());
          copied.forEach((page) => main.addPage(page));
        } else {
          const bytes = dataUrlBytes(data);
          const image = data.startsWith('data:image/png') ? await main.embedPng(bytes) : await main.embedJpg(bytes);
          const page = main.addPage([595.28, 841.89]);
          page.drawText('Documentacion tecnica', { x: 40, y: 800, size: 16 });
          page.drawText(plain(product.name).slice(0, 80), { x: 40, y: 776, size: 12 });
          const maxWidth = page.getWidth() - 80;
          const maxHeight = page.getHeight() - 140;
          const scale = Math.min(maxWidth / image.width, maxHeight / image.height);
          const width = image.width * scale;
          const height = image.height * scale;
          page.drawImage(image, { x: 40, y: page.getHeight() - 110 - height, width, height });
        }
      } catch {
        const page = main.addPage([595.28, 841.89]);
        page.drawText(`No se pudo adjuntar la ficha de ${plain(product.name).slice(0, 60)}.`, { x: 40, y: 780, size: 12 });
      }
    }
    return new Blob([await main.save() as BlobPart], { type: 'application/pdf' });
  } catch {
    return blob;
  }
}

export async function buildQuotePdf(quote: StoredQuote, findings: Finding[], origin: string, products: Product[] = []): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 14;
  let y = 0;

  const newPage = () => {
    pdf.addPage();
    y = 18;
  };

  const ensure = (height: number) => {
    if (y + height > pageHeight - 16) newPage();
  };

  pdf.setFillColor(...NAVY);
  pdf.rect(0, 0, pageWidth, 32, 'F');
  pdf.setFillColor(...RED);
  pdf.rect(0, 32, pageWidth, 1.4, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('C.E.S.T.I.', margin, 14);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('COTIZACIÓN TÉCNICO-COMERCIAL', margin, 21);
  pdf.setFontSize(8);
  pdf.text(quote.quoteNumber, pageWidth - margin, 13, { align: 'right' });
  pdf.text(new Date(quote.updatedAt).toLocaleDateString('es-AR'), pageWidth - margin, 19, { align: 'right' });
  pdf.text(`Revisión ${quote.revision} · ${statusLabel(quote.status)}`, pageWidth - margin, 25, { align: 'right' });
  y = 42;

  pdf.setTextColor(...INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('Datos del cliente', margin, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const customer = quote.customer;
  const customerLines = [
    `Nombre / razón social: ${customer?.name || 'Pendiente'}`,
    customer?.company ? `Empresa: ${customer.company}` : '',
    `Correo: ${customer?.email || 'Pendiente'}`,
    `Teléfono: ${customer?.phone || 'Pendiente'}`,
    customer?.location ? `Ubicación: ${customer.location}` : '',
    `Actividad: ${activityLabel(customer?.activity)}`,
    `Tipo de instalación: ${installationLabel(quote.installationType)}`,
  ].filter(Boolean);
  customerLines.forEach((line) => {
    pdf.text(line, margin, y);
    y += 5;
  });
  if (customer?.notes) {
    const notes = pdf.splitTextToSize(`Observaciones del cliente: ${customer.notes}`, pageWidth - margin * 2);
    pdf.text(notes, margin, y);
    y += notes.length * 4.5;
  }
  y += 4;

  if (quote.previewImage) {
    ensure(78);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Instalación diseñada', margin, y);
    y += 4;
    try {
      const format = quote.previewImage.includes('image/png') ? 'PNG' : 'JPEG';
      pdf.addImage(quote.previewImage, format, margin, y, pageWidth - margin * 2, 68);
      y += 74;
    } catch {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.text('No se pudo incrustar la captura del escenario.', margin, y);
      y += 8;
    }
  }

  const infra = quote.bom.lines.filter((line) => line.section === 'infrastructure');
  const equipment = quote.bom.lines.filter((line) => line.section === 'equipment');
  const services = quote.bom.lines.filter((line) => line.section === 'service');
  const pending = quote.bom.lines.filter((line) => line.section !== 'infrastructure' && line.unitPrice == null);

  const drawTable = (title: string, rows: StoredQuote['bom']['lines'], priced: boolean) => {
    ensure(18);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...INK);
    pdf.text(title, margin, y);
    y += 5;
    pdf.setFillColor(241, 245, 249);
    pdf.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...MUTED);
    pdf.text('Descripción', margin + 2, y + 4.5);
    pdf.text('Cant.', pageWidth - margin - 62, y + 4.5);
    pdf.text(priced ? 'Unitario' : 'Precio', pageWidth - margin - 42, y + 4.5);
    pdf.text(priced ? 'Subtotal' : '', pageWidth - margin - 2, y + 4.5, { align: 'right' });
    y += 8;
    rows.forEach((row, index) => {
      const description = pdf.splitTextToSize(`${row.name}${row.sku ? ` · ${row.sku}` : ''}`, 110);
      const height = Math.max(8, description.length * 4 + 3);
      ensure(height + 2);
      if (index % 2 === 0) {
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, y - 3, pageWidth - margin * 2, height, 'F');
      }
      pdf.setTextColor(...INK);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(description, margin + 2, y + 1);
      pdf.text(String(row.quantity), pageWidth - margin - 62, y + 1);
      if (!priced || row.section === 'infrastructure') {
        pdf.setTextColor(...MUTED);
        pdf.text('Sin cargo', pageWidth - margin - 42, y + 1);
      } else if (row.unitPrice == null) {
        pdf.setTextColor(...RED);
        pdf.text('A COTIZAR', pageWidth - margin - 42, y + 1);
      } else {
        pdf.setTextColor(...INK);
        pdf.text(money(row.unitPrice, quote.bom.currency), pageWidth - margin - 42, y + 1);
        pdf.text(money(row.unitPrice * row.quantity, quote.bom.currency), pageWidth - margin - 2, y + 1, { align: 'right' });
      }
      y += height;
    });
    y += 4;
  };

  if (infra.length) drawTable('Infraestructura del cliente (no se suma)', infra, false);
  if (equipment.length) drawTable('Equipamiento C.E.S.T.I.', equipment, true);
  if (services.length) drawTable('Software y servicios', services, true);

  ensure(42);
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 7;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...INK);
  pdf.text('Subtotal de equipamiento y servicios con precio', margin, y);
  pdf.text(money(quote.bom.onceSubtotal, quote.bom.currency), pageWidth - margin, y, { align: 'right' });
  y += 6;
  pdf.text('Abonos con precio publicado', margin, y);
  pdf.text(quote.bom.recurringSubtotal > 0 ? money(quote.bom.recurringSubtotal, quote.bom.currency) : 'Sin abonos cotizados', pageWidth - margin, y, { align: 'right' });
  y += 6;
  pdf.text('Impuestos', margin, y);
  pdf.text(quote.bom.tax == null ? 'Pendiente de configuración comercial' : money(quote.bom.tax, quote.bom.currency), pageWidth - margin, y, { align: 'right' });
  y += 8;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Total con precio definido', margin, y);
  pdf.text(money(quote.bom.totalPriced, quote.bom.currency), pageWidth - margin, y, { align: 'right' });
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...RED);
  const caveat = pending.length
    ? `Este total no es un precio cerrado. Hay ${pending.length} ítem(s) A COTIZAR que no se suman como cero.`
    : 'Todos los ítems comerciales de esta revisión tienen precio de catálogo o un precio cargado por C.E.S.T.I.';
  const caveatLines = pdf.splitTextToSize(caveat, pageWidth - margin * 2);
  pdf.text(caveatLines, margin, y);
  y += caveatLines.length * 4 + 4;

  const technical = findings.filter((item) => item.status === 'pending' || item.status === 'incompatible').slice(0, 8);
  if (technical.length) {
    ensure(16);
    pdf.setTextColor(...INK);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Observaciones técnicas', margin, y);
    y += 6;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    technical.forEach((item) => {
      const lines = pdf.splitTextToSize(`• ${item.message}`, pageWidth - margin * 2);
      ensure(lines.length * 4 + 2);
      pdf.text(lines, margin, y);
      y += lines.length * 4 + 1;
    });
    y += 2;
  }

  ensure(48);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...INK);
  pdf.text('Validez y contacto', margin, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  const validity = quote.bom.validityDays
    ? `Propuesta válida por ${quote.bom.validityDays} días desde la fecha de esta revisión.`
    : 'Validez comercial: pendiente de configuración. Confirmala con C.E.S.T.I. antes de tomar la propuesta como cerrada.';
  pdf.text(pdf.splitTextToSize(validity, pageWidth - margin * 2 - 40), margin, y);
  y += 12;
  pdf.text(`${COMPANY.legal}`, margin, y);
  y += 4.5;
  pdf.text(`${COMPANY.email} · ${COMPANY.phone}`, margin, y);
  y += 4.5;
  pdf.text(COMPANY.address, margin, y);

  const readUrl = `${origin}/cotizacion-online?ver=${encodeURIComponent(quote.quoteNumber)}`;
  try {
    const qr = await QRCode.toDataURL(readUrl, { margin: 0, width: 180, color: { dark: '#011832', light: '#ffffff' } });
    pdf.addImage(qr, 'PNG', pageWidth - margin - 28, y - 18, 28, 28);
  } catch {
    // The written link still lets the customer reopen the quote.
  }
  y += 12;
  ensure(20);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Consulta de solo lectura', margin, y);
  y += 5;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(pdf.splitTextToSize(readUrl, pageWidth - margin * 2), margin, y);
  y += 10;
  pdf.setFont('helvetica', 'bold');
  pdf.text('Código de recuperación para editar', margin, y);
  y += 5;
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(12);
  pdf.text(quote.recoveryCode || 'Disponible en el enlace privado de edición', margin, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...MUTED);
  const secretNote = 'El código QR abre la cotización en consulta. Para modificar el proyecto hace falta este código de recuperación. El número público no alcanza para editar.';
  pdf.text(pdf.splitTextToSize(secretNote, pageWidth - margin * 2), margin, y);

  return appendTechnicalDocs(pdf.output('blob'), technicalDocsForQuote(quote, products));
}

export async function downloadQuotePdf(quote: StoredQuote, findings: Finding[], origin: string, products: Product[] = []) {
  const blob = await buildQuotePdf(quote, findings, origin, products);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${quote.quoteNumber}-rev${quote.revision}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
