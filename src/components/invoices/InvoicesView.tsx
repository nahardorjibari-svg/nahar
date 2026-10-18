import React, { useState, useMemo } from 'react';
import {
  FileText,
  Printer,
  Search,
  CheckCircle2,
  MapPin,
  Phone,
  QrCode,
  ShieldCheck,
  Eye,
  Download,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { SaleOrder, BrandSettings } from '../../types';
import { formatBDT, formatBDDate } from '../../services/dataService';

interface InvoicesViewProps {
  orders: SaleOrder[];
  brandSettings: BrandSettings;
  onOpenPrintModal: (order: SaleOrder) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  orders,
  brandSettings,
  onOpenPrintModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(orders[0] || null);

  // Verification testing state
  const [verifyTokenInput, setVerifyTokenInput] = useState('');
  const [verifiedResult, setVerifiedResult] = useState<{
    success: boolean;
    order?: SaleOrder;
    message?: string;
  } | null>(null);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const q = searchTerm.trim().toLowerCase();
    return orders.filter(
      (o) =>
        o.invoiceNumber.toLowerCase().includes(q) ||
        o.orderNumber.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.phone.toLowerCase().includes(q) ||
        o.items.some((i) => i.productCode.toLowerCase().includes(q))
    );
  }, [orders, searchTerm]);

  const activeOrder = selectedOrder || filteredOrders[0] || null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyTokenInput.trim()) return;
    const query = verifyTokenInput.trim().toLowerCase();

    const matched = orders.find(
      (o) =>
        o.verificationToken.toLowerCase() === query ||
        o.invoiceNumber.toLowerCase() === query ||
        o.orderNumber.toLowerCase() === query
    );

    if (matched) {
      setVerifiedResult({
        success: true,
        order: matched,
        message: `Authentic memo issued by ${brandSettings.brandName}.`,
      });
    } else {
      setVerifiedResult({
        success: false,
        message: 'Invalid verification token or invoice number. No record found.',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <span>Invoices & QR Verification</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Printable customer memos with unique cryptographic QR authentication URLs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-white bg-white/10 px-3 py-1 rounded-xl font-mono-numbers font-bold border border-white/15 shadow-inner">
            {orders.length} Invoices Issued
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Invoice List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="glass-panel p-3 rounded-2xl border border-white/15 shadow-sm">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search Invoice #, Customer, Phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 glass-input rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-white/15 overflow-hidden shadow-xl divide-y divide-white/10 max-h-[640px] overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No invoices found matching query.
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = activeOrder?.id === order.id;
                return (
                  <div
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`p-3.5 transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-white/15 border-l-4 border-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono-numbers font-bold text-white">
                        {order.invoiceNumber}
                      </span>
                      <span className="font-mono-numbers font-bold text-emerald-400">
                        {formatBDT(order.financials.totalPayable)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1">
                      <span className="font-medium text-white">{order.customer.name}</span>
                      <span className="text-slate-400 font-mono-numbers">{formatBDDate(order.createdAt)}</span>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/10">
                      <span className="text-[10px] text-slate-400 truncate max-w-[180px]">
                        {order.items.map((i) => i.productCode).join(', ')} ({order.items.reduce((acc, i) => acc + i.quantity, 0)} pcs)
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                          order.payment.status === 'COLLECTED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        }`}
                      >
                        {order.payment.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Selected Invoice Preview & Verification Tester (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {activeOrder ? (
            <div className="glass-panel-elevated rounded-2xl border border-white/20 overflow-hidden shadow-2xl relative">
              <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
              {/* Preview Action Header */}
              <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono-numbers px-2.5 py-0.5 bg-white/15 text-white border border-white/20 rounded-md text-xs font-bold">
                    {activeOrder.invoiceNumber}
                  </span>
                  <span className="text-xs text-slate-300 font-medium">Invoice Preview</span>
                </div>

                <button
                  onClick={() => onOpenPrintModal(activeOrder)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-300/40"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print / Download PDF</span>
                </button>
              </div>

              {/* Invoice Body Container */}
              <div className="p-6 space-y-5 text-xs text-slate-200">
                {/* Brand Header */}
                <div className="flex justify-between items-start border-b border-white/10 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 border-2 border-emerald-400 p-0.5 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center">
                      {brandSettings.logoUrl ? (
                        <img
                          src={brandSettings.logoUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="font-bold text-emerald-400 text-lg flex items-center justify-center h-full">
                          ন
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">{brandSettings.brandName}</h3>
                      <p className="text-[11px] text-emerald-400 font-medium">{brandSettings.slogan}</p>
                      <p className="text-[10px] text-slate-400">{brandSettings.address}</p>
                      <p className="text-[10px] text-slate-400">ফোন: {brandSettings.phone}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono-numbers font-bold text-white text-sm block">
                      {activeOrder.invoiceNumber}
                    </span>
                    <p className="text-[10px] text-slate-400">Order #{activeOrder.orderNumber}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{formatBDDate(activeOrder.createdAt)}</p>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-black/30 rounded-xl border border-white/10">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">
                      Customer Info
                    </span>
                    <p className="font-bold text-white text-xs">{activeOrder.customer.name}</p>
                    <p className="text-slate-300 font-mono-numbers">{activeOrder.customer.phone}</p>
                    <p className="text-slate-400 mt-0.5">{activeOrder.customer.address}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">
                      Delivery & Payment
                    </span>
                    <p className="font-semibold text-white">{activeOrder.courier.provider}</p>
                    <p className="text-sky-400 font-mono-numbers">
                      Track: {activeOrder.courier.trackingCode || 'Pending'}
                    </p>
                    <p className="text-slate-300 mt-1">
                      {activeOrder.payment.method} ({activeOrder.payment.status})
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-300 font-semibold border-b border-white/10 text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Item</th>
                        <th className="py-2.5 px-3 text-center">Qty</th>
                        <th className="py-2.5 px-3 text-right">Price (৳)</th>
                        <th className="py-2.5 px-3 text-right">Total (৳)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10 text-slate-200">
                      {activeOrder.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="py-2.5 px-3">
                            <span className="font-mono-numbers font-bold text-white mr-1.5 bg-white/10 px-1 rounded text-[10px] border border-white/10">
                              {it.productCode}
                            </span>
                            <span className="text-slate-300">{it.productName}</span>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono-numbers text-white">
                            {it.quantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-300">
                            {formatBDT(it.sellingPrice)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-white">
                            {formatBDT(it.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Financial Totals */}
                <div className="flex justify-between items-center pt-2">
                  <div className="p-2.5 bg-black/30 rounded-xl border border-white/10 flex items-center gap-2.5">
                    <QrCode className="w-5 h-5 text-emerald-400" />
                    <div>
                      <span className="font-bold text-[10px] text-white block">QR Authenticated</span>
                      <span className="font-mono-numbers text-[9px] text-slate-400">
                        {activeOrder.verificationToken.slice(0, 12)}...
                      </span>
                    </div>
                  </div>

                  <div className="w-52 space-y-1 font-mono-numbers text-right text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal:</span>
                      <span className="text-white">{formatBDT(activeOrder.financials.subtotal)}</span>
                    </div>
                    {activeOrder.financials.orderDiscount > 0 && (
                      <div className="flex justify-between text-rose-400">
                        <span>Discount:</span>
                        <span>-{formatBDT(activeOrder.financials.orderDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>Delivery:</span>
                      <span className="text-white">+{formatBDT(activeOrder.financials.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-white/10">
                      <span>Payable:</span>
                      <span className="text-emerald-400 text-base">{formatBDT(activeOrder.financials.totalPayable)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 glass-panel rounded-2xl border border-white/15">
              Select an invoice from the list to preview.
            </div>
          )}

          {/* Secure QR Verification Tester Box */}
          <div className="glass-panel p-5 rounded-2xl border border-white/15 shadow-xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white">QR Invoice Verification Sandbox</h3>
            </div>
            <p className="text-xs text-slate-400">
              Customers scan the unique invoice QR code to verify validity. Enter any invoice number or cryptographic token to simulate verification:
            </p>

            <form onSubmit={handleVerify} className="flex gap-2">
              <input
                type="text"
                placeholder="Paste token or enter Invoice # (e.g. ND-INV-2026-1042)..."
                value={verifyTokenInput}
                onChange={(e) => setVerifyTokenInput(e.target.value)}
                className="flex-1 px-3 py-2 glass-input rounded-xl text-xs text-white placeholder-slate-500 font-mono-numbers focus:ring-1 focus:ring-emerald-400"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-300/40"
              >
                Verify Authenticity
              </button>
            </form>

            {verifiedResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2.5 backdrop-blur-md ${
                  verifiedResult.success
                    ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                    : 'bg-rose-500/20 border border-rose-500/40 text-rose-200'
                }`}
              >
                {verifiedResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{verifiedResult.message}</p>
                  {verifiedResult.order && (
                    <div className="mt-1 text-[11px] space-y-0.5 text-emerald-300 font-mono-numbers">
                      <p>Order: {verifiedResult.order.orderNumber} · Customer: {verifiedResult.order.customer.name}</p>
                      <p>Total: {formatBDT(verifiedResult.order.financials.totalPayable)} ({verifiedResult.order.payment.status})</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
