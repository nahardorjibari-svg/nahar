import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  TrendingUp,
  Search,
  Calendar,
  Eye,
  Download,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Truck,
  RotateCcw,
  FileText,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  CheckSquare,
} from 'lucide-react';
import { SaleOrder, Product, PaymentStatus, OrderStatus } from '../../types';
import { formatBDT, formatBDDate } from '../../services/dataService';

interface SalesHistoryViewProps {
  orders: SaleOrder[];
  products: Product[];
  onNavigateToNewSale: () => void;
  onOpenInvoice: (order: SaleOrder) => void;
  onCancelOrder: (orderId: string, reason: string) => Promise<void>;
  onUpdateStatus?: (orderId: string, status: OrderStatus, paymentStatus?: PaymentStatus) => Promise<void>;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  orders,
  products,
  onNavigateToNewSale,
  onOpenInvoice,
  onCancelOrder,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentStatus>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');

  // Cancel modal state
  const [orderToCancel, setOrderToCancel] = useState<SaleOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSubmittingCancel, setIsSubmittingCancel] = useState(false);

  // Filtering
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status filter
      if (statusFilter !== 'ALL') {
        if (order.status !== statusFilter) return false;
      }
      // Payment filter
      if (paymentFilter !== 'ALL' && order.payment.status !== paymentFilter) {
        return false;
      }
      // Date filter
      if (dateFilter !== 'ALL') {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        if (dateFilter === 'TODAY') {
          if (
            orderDate.getFullYear() !== now.getFullYear() ||
            orderDate.getMonth() !== now.getMonth() ||
            orderDate.getDate() !== now.getDate()
          ) {
            return false;
          }
        } else if (dateFilter === 'WEEK') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (orderDate < sevenDaysAgo) return false;
        } else if (dateFilter === 'MONTH') {
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (orderDate < thirtyDaysAgo) return false;
        }
      }

      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        const matchesOrder =
          order.orderNumber.toLowerCase().includes(q) ||
          order.invoiceNumber.toLowerCase().includes(q) ||
          order.customer.name.toLowerCase().includes(q) ||
          order.customer.phone.toLowerCase().includes(q) ||
          order.customer.district.toLowerCase().includes(q) ||
          order.items.some(
            (i) =>
              i.productCode.toLowerCase().includes(q) ||
              i.productName.toLowerCase().includes(q)
          );
        if (!matchesOrder) return false;
      }

      return true;
    });
  }, [orders, statusFilter, paymentFilter, dateFilter, searchTerm]);

  // Financial aggregates (EXCLUDING cancelled or returned orders for revenue & profit)
  const stats = useMemo(() => {
    let grossSales = 0;
    let netSalesRevenue = 0;
    let totalCogs = 0;
    let totalExpenses = 0;
    let unitsSold = 0;
    let collectedCash = 0;
    let pendingCodAmount = 0;
    let activeOrdersCount = 0;

    orders.forEach((o) => {
      if (o.status !== 'CANCELLED') {
        activeOrdersCount += 1;
        grossSales += o.financials.subtotal;
        netSalesRevenue += o.financials.subtotal - o.financials.orderDiscount;
        totalCogs += o.financials.totalCogs;
        totalExpenses += o.financials.totalExpenses;
        unitsSold += o.items.reduce((acc, i) => acc + i.quantity, 0);

        if (o.payment.status === 'COLLECTED') {
          collectedCash += o.financials.totalPayable;
        } else if (o.payment.status === 'PENDING_COD') {
          pendingCodAmount += o.financials.totalPayable;
        }
      }
    });

    const grossProfit = netSalesRevenue - totalCogs;
    const netProfit = grossProfit - totalExpenses;

    return {
      grossSales,
      netSalesRevenue,
      totalCogs,
      grossProfit,
      totalExpenses,
      netProfit,
      unitsSold,
      collectedCash,
      pendingCodAmount,
      activeOrdersCount,
    };
  }, [orders]);

  const handleConfirmCancel = async () => {
    if (!orderToCancel || !cancelReason.trim()) return;
    try {
      setIsSubmittingCancel(true);
      await onCancelOrder(orderToCancel.id, cancelReason.trim());
      setOrderToCancel(null);
      setCancelReason('');
    } catch (e: any) {
      alert(e?.message || 'Failed to cancel order');
    } finally {
      setIsSubmittingCancel(false);
    }
  };

  const exportSalesCsv = () => {
    const headers = [
      'Order Date',
      'Order Number',
      'Invoice Number',
      'Customer Name',
      'Phone',
      'District',
      'Product Codes',
      'Items Count',
      'Subtotal (BDT)',
      'Discount (BDT)',
      'Delivery Fee (BDT)',
      'Total Payable (BDT)',
      'COGS (BDT)',
      'Gross Profit (BDT)',
      'Expenses (BDT)',
      'Net Profit (BDT)',
      'Payment Method',
      'Payment Status',
      'Order Status',
      'Origin Video',
    ];

    const rows = filteredOrders.map((o) => [
      `"${formatBDDate(o.createdAt)}"`,
      `"${o.orderNumber}"`,
      `"${o.invoiceNumber}"`,
      `"${o.customer.name}"`,
      `"${o.customer.phone}"`,
      `"${o.customer.district}"`,
      `"${o.items.map((i) => `${i.productCode} (${i.quantity}x)`).join('; ')}"`,
      o.items.reduce((acc, i) => acc + i.quantity, 0),
      o.financials.subtotal,
      o.financials.orderDiscount,
      o.financials.deliveryFee,
      o.financials.totalPayable,
      o.financials.totalCogs,
      o.financials.grossProfit,
      o.financials.totalExpenses,
      o.financials.netProfit,
      `"${o.payment.method}"`,
      `"${o.payment.status}"`,
      `"${o.status}"`,
      `"${o.originVideoTitle || 'Direct / Walk-in'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `nahar_dorjibari_sales_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Add */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <span>Sales & Order Ledger</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time transaction tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={exportSalesCsv}
            className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-300 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onNavigateToNewSale}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Sale</span>
          </button>
        </div>
      </div>

      {/* 5 Financial KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Net Sales Revenue */}
        <div className="glass-card glass-shine-top p-4 rounded-2xl border border-white/15">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Net Revenue
          </span>
          <div className="text-lg sm:text-xl font-bold text-white font-mono-numbers mt-1">
            {formatBDT(stats.netSalesRevenue)}
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-0.5 block truncate">
            {stats.unitsSold} pcs sold ({stats.activeOrdersCount} orders)
          </span>
        </div>

        {/* Purchase Cost (COGS) */}
        <div className="glass-card glass-shine-top p-4 rounded-2xl border border-white/15">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            COGS (Wholesale Cost)
          </span>
          <div className="text-lg sm:text-xl font-bold text-slate-300 font-mono-numbers mt-1">
            {formatBDT(stats.totalCogs)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
            Actual product acquisition
          </span>
        </div>

        {/* Gross Profit */}
        <div className="glass-card glass-shine-top p-4 rounded-2xl border border-emerald-500/30">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
            Gross Profit
          </span>
          <div className="text-lg sm:text-xl font-bold text-emerald-300 font-mono-numbers mt-1">
            {formatBDT(stats.grossProfit)}
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-0.5 block truncate">
            Revenue minus COGS
          </span>
        </div>

        {/* Expenses */}
        <div className="glass-card glass-shine-top p-4 rounded-2xl border border-white/15">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Expenses (Pkg + Ads)
          </span>
          <div className="text-lg sm:text-xl font-bold text-rose-400 font-mono-numbers mt-1">
            -{formatBDT(stats.totalExpenses)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
            Poly, boxes & ad share
          </span>
        </div>

        {/* Net Profit */}
        <div className="glass-card glass-shine-top p-4 rounded-2xl border border-amber-400/30 col-span-2 sm:col-span-1 shadow-[0_0_20px_rgba(251,191,36,0.15)]">
          <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
            Net Profit
          </span>
          <div className="text-lg sm:text-xl font-bold text-amber-200 font-mono-numbers mt-1">
            +{formatBDT(stats.netProfit)}
          </div>
          <span className="text-[10px] text-amber-300/80 mt-0.5 block truncate">
            Final brand net margin
          </span>
        </div>
      </div>

      {/* Filter and Table Card */}
      <div className="glass-panel rounded-2xl border border-white/15 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        {/* Filters bar */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by invoice, customer, phone, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 glass-input rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 glass-input rounded-xl text-xs font-semibold text-white focus:ring-1 focus:ring-emerald-400"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
              <option value="CONFIRMED" className="bg-slate-900 text-white">Confirmed / New</option>
              <option value="PACKING" className="bg-slate-900 text-white">Packing</option>
              <option value="PACKED" className="bg-slate-900 text-white">Packed</option>
              <option value="DISPATCHED" className="bg-slate-900 text-white">Dispatched</option>
              <option value="DELIVERED" className="bg-slate-900 text-white">Delivered</option>
              <option value="CANCELLED" className="bg-slate-900 text-white">Cancelled</option>
              <option value="RETURNED" className="bg-slate-900 text-white">Returned</option>
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="px-3 py-1.5 glass-input rounded-xl text-xs font-semibold text-white focus:ring-1 focus:ring-emerald-400"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Payments</option>
              <option value="PENDING_COD" className="bg-slate-900 text-white">COD Pending</option>
              <option value="COLLECTED" className="bg-slate-900 text-white">Collected</option>
              <option value="REFUNDED" className="bg-slate-900 text-white">Refunded</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-1.5 glass-input rounded-xl text-xs font-semibold text-white focus:ring-1 focus:ring-emerald-400"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Time</option>
              <option value="TODAY" className="bg-slate-900 text-white">Today</option>
              <option value="WEEK" className="bg-slate-900 text-white">Last 7 Days</option>
              <option value="MONTH" className="bg-slate-900 text-white">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 text-slate-300 uppercase font-semibold border-b border-white/10 tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Invoice / Order</th>
                <th className="py-3.5 px-4">Customer & District</th>
                <th className="py-3.5 px-4">3-Piece Items</th>
                <th className="py-3.5 px-4 text-right">Total (৳)</th>
                <th className="py-3.5 px-4 text-right">Profit (৳)</th>
                <th className="py-3.5 px-4 text-center">Payment</th>
                <th className="py-3.5 px-4 text-center">Fulfillment Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 text-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <ShoppingBag className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-medium">No sales or orders match your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isCancelled = order.status === 'CANCELLED';

                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-white/[0.04] transition-colors ${
                        isCancelled ? 'bg-black/30 text-slate-500 line-through' : ''
                      }`}
                    >
                      {/* Order / Invoice */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono-numbers font-bold text-white block no-underline">
                          {order.orderNumber}
                        </span>
                        <span className="text-[11px] font-mono-numbers text-slate-400 block no-underline">
                          {order.invoiceNumber}
                        </span>
                        {order.originVideoTitle && (
                          <span className="text-[10px] text-sky-300 bg-sky-500/20 border border-sky-500/30 px-1.5 py-0.5 rounded mt-0.5 inline-block truncate max-w-[140px] no-underline">
                            {order.originVideoTitle}
                          </span>
                        )}
                      </td>

                      {/* Date & Customer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white no-underline">{order.customer.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono-numbers no-underline">
                          {order.customer.phone}
                        </div>
                        <div className="text-[10px] text-slate-400 no-underline">
                          {order.customer.district} · {formatBDDate(order.createdAt)}
                        </div>
                      </td>

                      {/* Items */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-xs">
                          {order.items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] no-underline">
                              <span className="font-mono-numbers font-semibold text-white bg-white/10 px-1.5 py-0.5 rounded text-[10px] border border-white/10">
                                {it.productCode}
                              </span>
                              <span className="truncate text-slate-300 max-w-[120px]">
                                {it.productName}
                              </span>
                              <span className="text-slate-400 font-mono-numbers">
                                ×{it.quantity} (@৳{it.sellingPrice})
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Selling Total */}
                      <td className="py-3.5 px-4 text-right font-mono-numbers no-underline">
                        <div className="font-bold text-white">
                          {formatBDT(order.financials.totalPayable)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Sub: {formatBDT(order.financials.subtotal)}
                        </div>
                      </td>

                      {/* COGS & Profit */}
                      <td className="py-3.5 px-4 text-right font-mono-numbers no-underline">
                        {isCancelled ? (
                          <span className="text-slate-500 text-[11px]">Cancelled</span>
                        ) : (
                          <>
                            <div className="font-bold text-emerald-400">
                              +{formatBDT(order.financials.grossProfit)}
                              <span className="text-[10px] text-slate-400 font-normal block">
                                Gross Profit
                              </span>
                            </div>
                          </>
                        )}
                      </td>

                      {/* Payment */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            order.payment.status === 'COLLECTED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : order.payment.status === 'PENDING_COD'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {order.payment.status}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {order.payment.method}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            order.status === 'DELIVERED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : order.status === 'PACKED'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : order.status === 'PACKING'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : order.status === 'DISPATCHED'
                              ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                              : order.status === 'CANCELLED'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-white/10 text-slate-300 border-white/20'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenInvoice(order)}
                            className="p-1.5 glass-card hover:border-white/30 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                            title="View & Print Invoice"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {!isCancelled && order.status !== 'DELIVERED' && (
                            <button
                              onClick={() => {
                                setOrderToCancel(order);
                                setCancelReason('');
                              }}
                              className="p-1.5 glass-card hover:border-rose-400/40 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Cancel Order & Safely Restore Stock"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {orderToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-panel-elevated rounded-3xl max-w-md w-full p-6 space-y-4 border border-white/25 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-white text-sm">
                Cancel Order & Restore Inventory
              </h3>
            </div>

            <p className="text-xs text-slate-300">
              You are cancelling Order{' '}
              <span className="font-mono-numbers font-bold text-white">
                {orderToCancel.orderNumber}
              </span>{' '}
              ({orderToCancel.customer.name}).
            </p>

            <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-300 text-[11px] space-y-1 backdrop-blur-sm">
              <p className="font-semibold">Safe Atomic Stock Restoration:</p>
              <ul className="list-disc list-inside space-y-0.5 text-slate-200">
                {orderToCancel.items.map((i, idx) => (
                  <li key={idx}>
                    Restoring <span className="font-bold font-mono-numbers text-amber-300">+{i.quantity}</span> pcs to{' '}
                    <span className="font-bold text-white">{i.productCode}</span> ({i.productName})
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Reason for cancellation <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Customer changed mind / incorrect address"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-3 glass-input rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setOrderToCancel(null)}
                disabled={isSubmittingCancel}
                className="px-4 py-2 glass-card hover:border-white/30 rounded-xl text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={isSubmittingCancel || !cancelReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {isSubmittingCancel ? 'Processing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
