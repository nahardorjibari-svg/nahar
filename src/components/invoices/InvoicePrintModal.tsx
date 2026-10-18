import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Printer, QrCode as QrIcon, ShieldCheck, FileText, Download } from 'lucide-react';
import { SaleOrder, BrandSettings } from '../../types';
import { formatBDT, formatBDDate } from '../../services/dataService';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface InvoicePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SaleOrder | null;
  brandSettings: BrandSettings;
  onVerifyOrder?: (order: SaleOrder) => void;
}

export const InvoicePrintModal: React.FC<InvoicePrintModalProps> = ({
  isOpen,
  onClose,
  order,
  brandSettings,
  onVerifyOrder,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (order) {
      const verificationUrl = `${window.location.origin}/?verify_invoice=${encodeURIComponent(
        order.invoiceNumber
      )}&token=${encodeURIComponent(order.verificationToken)}`;

      QRCode.toDataURL(verificationUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('Failed to generate QR code', err));
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (invoiceRef.current) {
      const canvas = await html2canvas(invoiceRef.current);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${order.invoiceNumber}.pdf`);
    }
  };

  const totalPaid = order.payment.status === 'COLLECTED' ? order.financials.totalPayable : 0;
  const codDue = order.payment.status === 'PENDING_COD' ? order.financials.totalPayable : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-auto flex flex-col border border-slate-200 overflow-hidden text-xs">
        {/* Top Control Bar */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono-numbers px-2 py-0.5 bg-amber-500 text-slate-950 font-bold rounded text-[11px]">
              {order.invoiceNumber}
            </span>
            <span className="text-slate-300 font-medium">Invoice</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Sheet Area */}
        <div
          ref={invoiceRef}
          id="invoice-printable-sheet"
          className="p-6 sm:p-8 space-y-4 text-slate-800 bg-white print:p-4 print:space-y-3"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 pb-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 p-0.5 bg-white shrink-0 shadow-xs">
                {brandSettings.logoUrl ? (
                  <img src={brandSettings.logoUrl} alt="" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full rounded-full bg-amber-500/10 text-amber-900 font-bold flex items-center justify-center">ন</div>
                )}
              </div>
              <div className="space-y-0.5">
                <h1 className="font-bold text-lg text-slate-900">{brandSettings.brandName}</h1>
                <p className="text-[10px] text-slate-500">{brandSettings.address}</p>
                <p className="text-[10px] text-slate-500">ফোন: {brandSettings.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-mono-numbers font-bold text-slate-900 block">{order.invoiceNumber}</span>
              <p className="text-[10px] text-slate-500">Date: {formatBDDate(order.createdAt)}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="font-bold text-slate-900">{order.customer.name}</p>
              <p className="text-[10px] text-slate-600">{order.customer.phone}</p>
              <p className="text-[10px] text-slate-600">{order.customer.address}, {order.customer.district}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-500">Status: <span className="uppercase text-amber-700">{order.status}</span></p>
              <p className="text-[10px] font-bold text-slate-500">Payment: <span className="text-slate-900">{order.payment.method} ({order.payment.status})</span></p>
            </div>
          </div>

          {/* Items */}
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 text-slate-700 border-b">
              <tr>
                <th className="p-2">Item Details</th>
                <th className="p-2 text-center">Qty</th>
                <th className="p-2 text-right">Unit Price</th>
                <th className="p-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="p-2">
                    <p className="font-bold text-slate-900">[{item.productCode}] {item.productName}</p>
                    <p className="text-[9px] text-slate-500">{item.color} · {item.size}</p>
                  </td>
                  <td className="p-2 text-center font-bold">{item.quantity}</td>
                  <td className="p-2 text-right">{formatBDT(item.sellingPrice)}</td>
                  <td className="p-2 text-right font-bold">{formatBDT(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculations */}
          <div className="border-t pt-2 space-y-1 text-right text-xs font-mono-numbers">
            <div className="flex justify-between"><span>Subtotal:</span><span>{formatBDT(order.financials.subtotal)}</span></div>
            {order.financials.orderDiscount > 0 && <div className="flex justify-between text-rose-600"><span>Discount:</span><span>-{formatBDT(order.financials.orderDiscount)}</span></div>}
            <div className="flex justify-between"><span>Delivery:</span><span>+{formatBDT(order.financials.deliveryFee)}</span></div>
            <div className="flex justify-between font-bold text-slate-900 border-t pt-1"><span>Total Payable:</span><span>{formatBDT(order.financials.totalPayable)}</span></div>
          </div>

          {/* QR */}
          <div className="flex justify-center pt-2">
            {qrDataUrl && <img src={qrDataUrl} alt="QR" className="w-16 h-16" />}
          </div>
        </div>
      </div>
    </div>
  );
};
