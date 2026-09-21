import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order, Customer } from '../types';
import { ALIAS_TRANSFERENCIA, formatWhatsAppPhone } from './orders';
import { formatCurrency } from './utils';

export function createOrderPDF(order: Order, customer: Customer): jsPDF {
  // Mobile/A4 friendly format
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Palette Fiambrería Mamá: Borgoña / Rojo Deli (#991b1b), Slate (#1e293b), Dorado (#f59e0b)
  const primaryColor = [153, 27, 27]; // #991b1b
  const slateColor = [30, 41, 59];

  // Header Banner
  doc.setFillColor(153, 27, 27);
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('MAMÁ - FIAMBRES & EMBUTIDOS', 14, 15);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Distribución Mayorista y Minorista • San Juan, Argentina', 14, 22);
  doc.text(`Alias Transferencia: ${ALIAS_TRANSFERENCIA}`, 14, 27);

  // Remito / Pedido badge
  const orderNumberStr = order.order_number 
    ? `PEDIDO Nº ${String(order.order_number).padStart(5, '0')}`
    : `PEDIDO #${(order.id || '').slice(0, 8).toUpperCase()}`;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(orderNumberStr, 196, 16, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${order.order_date || new Date().toISOString().split('T')[0]}`, 196, 23, { align: 'right' });

  // Client Info Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 38, 182, 30, 3, 3, 'FD');

  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('DATOS DEL CLIENTE', 18, 45);

  doc.setTextColor(slateColor[0], slateColor[1], slateColor[2]);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Cliente: ${customer.name || 'Consumidor Final'}`, 18, 52);
  doc.text(`Dirección: ${customer.address || 'San Juan'}`, 18, 58);
  doc.text(`Teléfono: ${customer.phone || 'Sin registrar'}`, 18, 64);

  doc.text(`Día de Visita: ${customer.visit_day || customer.preferred_day || 'A coordinar'}`, 120, 52);
  doc.text(`Estado Pago: ${order.payment_status || 'PENDIENTE'}`, 120, 58);
  if (order.due_date) {
    doc.text(`Vencimiento / Cobro: ${order.due_date}`, 120, 64);
  }

  // Items Table
  const tableRows = (order.items || []).map((item) => {
    const qty = Number(item.actual_qty_weight || item.requested_qty || 0);
    const unit = item.unit || item.product?.unit || 'kg';
    const formattedQty = `${qty.toFixed(3).replace(/\.?0+$/, '')} ${unit}`;
    const unitPrice = formatCurrency(item.unit_price || 0);
    const subtotal = formatCurrency(item.subtotal || qty * (item.unit_price || 0));

    return [
      item.product_name || item.product?.name || 'Producto de Fiambrería',
      formattedQty,
      unitPrice,
      subtotal,
    ];
  });

  autoTable(doc, {
    startY: 73,
    head: [['Detalle del Producto', 'Cantidad / Peso', 'Precio Unitario', 'Subtotal']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [153, 27, 27],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'left',
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 35, halign: 'right' },
      2: { cellWidth: 32, halign: 'right' },
      3: { cellWidth: 30, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  // Totals Section
  // @ts-ignore
  const finalY = doc.lastAutoTable?.finalY || 130;

  const totalAmount = order.actual_total || order.estimated_total || 0;
  const currentDebt = customer.debt_amount || 0;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(110, finalY + 6, 86, 38, 2, 2, 'FD');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Total del Pedido:', 116, finalY + 15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(153, 27, 27);
  doc.text(formatCurrency(totalAmount), 190, finalY + 15, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Saldo Cta. Cte. Total:', 116, finalY + 24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(currentDebt > 0 ? 180 : 30, currentDebt > 0 ? 30 : 120, 30);
  doc.text(formatCurrency(currentDebt), 190, finalY + 24, { align: 'right' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Medio de pago: ${order.payment_method || 'A convenir'}`, 116, finalY + 34);

  // Observations / Footer
  if (order.notes) {
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Observaciones: ${order.notes}`, 14, finalY + 16);
  }

  // Footer Note
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageHeight - 18, 196, pageHeight - 18);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Comprobante oficial de Fiambrería y Delicatessen Mamá. ¡Muchas gracias por su compra!', 105, pageHeight - 12, { align: 'center' });
  doc.text(`Generado el ${new Date().toLocaleString('es-AR')}`, 105, pageHeight - 7, { align: 'center' });

  return doc;
}

export function downloadOrderPDF(order: Order, customer: Customer) {
  const doc = createOrderPDF(order, customer);
  const safeCustomer = (customer.name || 'cliente').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Pedido_Mama_${order.order_number || (order.id || '').slice(0, 6)}_${safeCustomer}.pdf`;
  doc.save(filename);
}

export function buildOrderWhatsAppText(order: Order, customer: Customer): string {
  const total = order.actual_total || order.estimated_total || 0;
  const itemsText = (order.items || []).map(i => {
    const qty = Number(i.actual_qty_weight || i.requested_qty || 0);
    const unit = i.unit || i.product?.unit || 'kg';
    return `• *${i.product_name || i.product?.name}*: ${qty} ${unit} x ${formatCurrency(i.unit_price)} = *${formatCurrency(i.subtotal)}*`;
  }).join('\n');

  const orderNum = order.order_number ? `#${order.order_number}` : '';

  return `🧀 *MAMÁ - FIAMBRES Y EMBUTIDOS* 🥓\n\nHola ${customer.name || ''}! 👋🏼 Te compartimos el detalle de tu pedido ${orderNum}:\n\n${itemsText}\n\n💰 *TOTAL PEDIDO:* *${formatCurrency(total)}*\n💳 *Alias para Transferencias:* *${ALIAS_TRANSFERENCIA}*\n\n¡Gracias por elegirnos! Te adjuntamos también el comprobante en PDF.`;
}

export function shareOrderViaWhatsApp(order: Order, customer: Customer) {
  const phone = formatWhatsAppPhone(customer.phone);
  const text = buildOrderWhatsAppText(order, customer);
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
