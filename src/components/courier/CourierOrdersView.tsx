import React, { useState, useMemo, useEffect } from 'react';
import {
  Truck,
  Search,
  ExternalLink,
  CheckCircle,
  Clock,
  PackageCheck,
  AlertCircle,
  Download,
  Filter,
  CheckCircle2,
  Package,
  Settings,
  Send,
  ShieldCheck,
  RefreshCw,
  Copy,
  X,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { SaleOrder, OrderStatus, PaymentStatus } from '../../types';
import { formatBDT, formatBDDate } from '../../services/dataService';
import {
  SteadfastCourierService,
  SteadfastSettings,
  SteadfastBookingResponse,
} from '../../services/steadfastCourierService';

interface CourierOrdersViewProps {
  orders: SaleOrder[];
  onUpdateStatus: (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    trackingCode?: string,
    courierUpdate?: {
      consignmentId?: string;
      bookingStatus?: 'PENDING' | 'BOOKED' | 'FAILED' | 'CANCELLED';
      bookedAt?: string;
      errorMessage?: string;
    }
  ) => Promise<void>;
}

export const CourierOrdersView: React.FC<CourierOrdersViewProps> = ({
  orders,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<'ALL' | 'Inside Dhaka' | 'Outside Dhaka'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'ALL' | 'BOOKED' | 'UNBOOKED'>('ALL');
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  // Steadfast Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [steadfastSettings, setSteadfastSettings] = useState<SteadfastSettings>(
    SteadfastCourierService.getSettings()
  );
  const [settingsNotice, setSettingsNotice] = useState<string | null>(null);

  // Booking Confirmation Modal
  const [orderToBook, setOrderToBook] = useState<SaleOrder | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccessMsg, setBookingSuccessMsg] = useState<string | null>(null);
  const [isBookingLoading, setIsBookingLoading] = useState(false);

  // Exclude cancelled orders from active courier operations
  const activeOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'CANCELLED');
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return activeOrders.filter((order) => {
      if (zoneFilter !== 'ALL' && order.courier.zone !== zoneFilter) {
        return false;
      }
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }
      if (bookingStatusFilter === 'BOOKED' && !order.courier.consignmentId) {
        return false;
      }
      if (bookingStatusFilter === 'UNBOOKED' && !!order.courier.consignmentId) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        return (
          order.orderNumber.toLowerCase().includes(q) ||
          order.invoiceNumber.toLowerCase().includes(q) ||
          order.customer.name.toLowerCase().includes(q) ||
          order.customer.phone.toLowerCase().includes(q) ||
          order.customer.district.toLowerCase().includes(q) ||
          (order.courier.trackingCode && order.courier.trackingCode.toLowerCase().includes(q)) ||
          (order.courier.consignmentId && order.courier.consignmentId.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [activeOrders, zoneFilter, statusFilter, bookingStatusFilter, searchTerm]);

  // Aggregate metrics
  const totalPendingDispatches = activeOrders.filter((o) => o.status === 'CONFIRMED').length;
  const inTransitCount = activeOrders.filter((o) => o.status === 'DISPATCHED').length;
  const deliveredCount = activeOrders.filter((o) => o.status === 'DELIVERED').length;
  const bookedOnSteadfastCount = activeOrders.filter((o) => !!o.courier.consignmentId).length;
  const totalCodToCollect = activeOrders
    .filter((o) => o.payment.status === 'PENDING_COD')
    .reduce((acc, o) => acc + o.financials.totalPayable, 0);

  // Book order on Steadfast
  const handleExecuteBooking = async () => {
    if (!orderToBook) return;
    setIsBookingLoading(true);
    setBookingError(null);

    try {
      const result: SteadfastBookingResponse = await SteadfastCourierService.bookParcel(orderToBook);

      if (result.success && result.consignmentId && result.trackingCode) {
        await onUpdateStatus(
          orderToBook.id,
          'DISPATCHED', // Move to in-transit once courier consignment is confirmed
          undefined,
          result.trackingCode,
          {
            consignmentId: result.consignmentId,
            bookingStatus: 'BOOKED',
            bookedAt: new Date().toISOString(),
            errorMessage: undefined,
          }
        );
        setBookingSuccessMsg(result.message);
        setTimeout(() => {
          setOrderToBook(null);
          setBookingSuccessMsg(null);
        }, 1500);
      } else {
        setBookingError(result.message || 'Failed to book parcel with Steadfast Courier.');
        // Record failed attempt
        await onUpdateStatus(
          orderToBook.id,
          orderToBook.status,
          undefined,
          undefined,
          {
            bookingStatus: 'FAILED',
            errorMessage: result.message,
          }
        );
      }
    } catch (e: any) {
      setBookingError(e.message || 'Unexpected booking error.');
    } finally {
      setIsBookingLoading(false);
    }
  };

  const handleMarkDispatched = async (order: SaleOrder) => {
    try {
      setIsUpdatingId(order.id);
      await onUpdateStatus(order.id, 'DISPATCHED');
    } catch (e: any) {
      alert(e?.message || 'Failed to update courier status');
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleMarkDelivered = async (order: SaleOrder) => {
    try {
      setIsUpdatingId(order.id);
      // When delivered via COD, update payment status to COLLECTED
      const newPaymentStatus = order.payment.method === 'COD' ? 'COLLECTED' : order.payment.status;
      await onUpdateStatus(order.id, 'DELIVERED', newPaymentStatus);
    } catch (e: any) {
      alert(e?.message || 'Failed to update delivery status');
    } finally {
      setIsUpdatingId(null);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    SteadfastCourierService.saveSettings(steadfastSettings);
    setSettingsNotice('Steadfast courier settings successfully saved!');
    setTimeout(() => {
      setSettingsNotice(null);
      setIsSettingsOpen(false);
    }, 1200);
  };

  const exportSteadfastManifest = () => {
    const headers = [
      'Invoice',
      'Consignment ID',
      'Recipient Name',
      'Recipient Phone',
      'Recipient Address',
      'COD Amount',
      'Note / Items',
      'Tracking Code',
      'Status',
    ];

    const rows = filteredOrders.map((o) => [
      `"${o.invoiceNumber}"`,
      `"${o.courier.consignmentId || 'Unbooked'}"`,
      `"${o.customer.name}"`,
      `"${o.customer.phone}"`,
      `"${o.customer.address}, ${o.customer.district}"`,
      o.payment.status === 'PENDING_COD' ? o.financials.totalPayable : 0,
      `"${o.items.map((i) => `${i.productCode} (${i.quantity}x)`).join('; ')}"`,
      `"${o.courier.trackingCode || ''}"`,
      `"${o.status}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `steadfast_courier_manifest_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-400" />
              <span>Steadfast Courier Operations & API</span>
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                steadfastSettings.isSandboxMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}
            >
              {steadfastSettings.isSandboxMode ? 'SANDBOX / TEST MODE' : 'OFFICIAL LIVE API'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official Steadfast Courier API integration: Book consignments, print shipping labels, track parcels via live tracking URL, and settle cash-on-delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-2 glass-card hover:border-white/30 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/15"
          >
            <Settings className="w-3.5 h-3.5 text-slate-400" />
            <span>API Settings</span>
          </button>

          <button
            onClick={exportSteadfastManifest}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-300/40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Bulk Manifest (CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card glass-shine-top p-4 rounded-2xl border border-white/15">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Pending Dispatch
          </span>
          <div className="text-xl font-bold text-white font-mono-numbers mt-1">
            {totalPendingDispatches} orders
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Awaiting courier pickup</span>
        </div>

        <div className="glass-card glass-shine-top p-4 rounded-2xl border border-sky-500/30">
          <span className="text-[11px] font-semibold text-sky-400 uppercase tracking-wider block">
            In Transit (Rider)
          </span>
          <div className="text-xl font-bold text-sky-300 font-mono-numbers mt-1">
            {inTransitCount} parcels
          </div>
          <span className="text-[10px] text-sky-400/80 mt-0.5 block">
            {bookedOnSteadfastCount} booked on Steadfast
          </span>
        </div>

        <div className="glass-card glass-shine-top p-4 rounded-2xl border border-emerald-500/30">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
            Delivered & Settled
          </span>
          <div className="text-xl font-bold text-emerald-300 font-mono-numbers mt-1">
            {deliveredCount} parcels
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Successfully received</span>
        </div>

        <div className="glass-card glass-shine-top p-4 rounded-2xl border border-amber-400/30">
          <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
            Outstanding COD Cash
          </span>
          <div className="text-xl font-bold text-amber-200 font-mono-numbers mt-1">
            {formatBDT(totalCodToCollect)}
          </div>
          <span className="text-[10px] text-amber-300/80 mt-0.5 block">To be remitted by courier</span>
        </div>
      </div>

      {/* Filter and Manifest Table */}
      <div className="glass-panel rounded-2xl border border-white/15 overflow-hidden shadow-xl relative">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Invoice, Recipient, Phone, Consignment, Tracking..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 glass-input rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={bookingStatusFilter}
              onChange={(e) => setBookingStatusFilter(e.target.value as any)}
              className="glass-input rounded-xl px-2.5 py-1 text-xs text-white focus:ring-1 focus:ring-emerald-400"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Bookings</option>
              <option value="BOOKED" className="bg-slate-900 text-white">Booked on Steadfast</option>
              <option value="UNBOOKED" className="bg-slate-900 text-white">Unbooked Orders</option>
            </select>

            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value as any)}
              className="glass-input rounded-xl px-2.5 py-1 text-xs text-white focus:ring-1 focus:ring-emerald-400"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Delivery Zones</option>
              <option value="Inside Dhaka" className="bg-slate-900 text-white">Inside Dhaka (৳70)</option>
              <option value="Outside Dhaka" className="bg-slate-900 text-white">Outside Dhaka (৳130)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="glass-input rounded-xl px-2.5 py-1 text-xs text-white focus:ring-1 focus:ring-emerald-400"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Statuses</option>
              <option value="CONFIRMED" className="bg-slate-900 text-white">Pending Pickup</option>
              <option value="DISPATCHED" className="bg-slate-900 text-white">In Transit</option>
              <option value="DELIVERED" className="bg-slate-900 text-white">Delivered</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase font-semibold text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Consignment / Invoice</th>
                <th className="py-3 px-4">Recipient Info</th>
                <th className="py-3 px-4">Destination & Zone</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">COD Collection</th>
                <th className="py-3 px-4 text-center">Steadfast Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No consignments found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => {
                  const isPending = ord.status === 'CONFIRMED';
                  const isDispatched = ord.status === 'DISPATCHED';
                  const isDelivered = ord.status === 'DELIVERED';
                  const isBooked = !!ord.courier.consignmentId;

                  return (
                    <tr key={ord.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-3 px-4 font-mono-numbers">
                        <span className="font-bold text-white block">{ord.invoiceNumber}</span>
                        {isBooked ? (
                          <div className="space-y-0.5 mt-0.5">
                            <span className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 inline-block">
                              CID: {ord.courier.consignmentId}
                            </span>
                            {ord.courier.trackingCode && (
                              <a
                                href={SteadfastCourierService.getTrackingUrl(ord.courier.trackingCode)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 hover:underline"
                              >
                                <span>Track: {ord.courier.trackingCode}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium block">
                            Not Booked with Courier
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 block">{formatBDDate(ord.createdAt)}</span>
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <span className="font-bold text-white block">{ord.customer.name}</span>
                        <span className="text-[11px] text-slate-300 font-mono-numbers">
                          {ord.customer.phone}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-sans">
                        <span className="font-semibold text-white">{ord.customer.district}</span>
                        <span
                          className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded ml-1.5 ${
                            ord.courier.zone === 'Inside Dhaka'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {ord.courier.zone}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-xs mt-0.5">
                          {ord.customer.address}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono-numbers font-semibold text-slate-200">
                        {ord.items.reduce((acc, i) => acc + i.quantity, 0)} pcs
                      </td>

                      <td className="py-3 px-4 text-right font-mono-numbers">
                        <div className="font-bold text-white">
                          {ord.payment.status === 'PENDING_COD' ? (
                            formatBDT(ord.financials.totalPayable)
                          ) : (
                            <span className="text-emerald-400 text-xs">Prepaid (৳0 COD)</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Delivery: ৳{ord.financials.deliveryFee}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            isDelivered
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isDispatched
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isDelivered
                            ? 'DELIVERED'
                            : isDispatched
                            ? 'IN TRANSIT'
                            : 'READY FOR PICKUP'}
                        </span>
                        {ord.courier.errorMessage && (
                          <span
                            title={ord.courier.errorMessage}
                            className="text-[9px] text-rose-400 font-semibold block truncate max-w-[120px] mx-auto mt-0.5"
                          >
                            ⚠️ {ord.courier.errorMessage}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                          {/* Book on Steadfast Button if not yet booked */}
                          {!isBooked && !isDelivered && (
                            <button
                              onClick={() => {
                                setOrderToBook(ord);
                                setBookingError(null);
                              }}
                              className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded text-[11px] transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Send className="w-3 h-3 text-slate-950" />
                              <span>Book Steadfast</span>
                            </button>
                          )}

                          {isPending && (
                            <button
                              onClick={() => handleMarkDispatched(ord)}
                              disabled={isUpdatingId === ord.id}
                              className="px-2.5 py-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-slate-950 font-bold rounded text-[11px] transition-colors cursor-pointer shadow-xs"
                            >
                              Dispatch
                            </button>
                          )}

                          {isDispatched && (
                            <button
                              onClick={() => handleMarkDelivered(ord)}
                              disabled={isUpdatingId === ord.id}
                              className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded text-[11px] transition-colors cursor-pointer shadow-xs"
                            >
                              Delivered & Collect
                            </button>
                          )}

                          {isDelivered && (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 justify-end">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>Settled</span>
                            </span>
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

      {/* Steadfast Booking Modal */}
      {orderToBook && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel-elevated rounded-2xl max-w-lg w-full p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/20 space-y-4 text-slate-100 relative overflow-hidden">
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">
                  Create Steadfast Courier Consignment
                </h3>
              </div>
              <button
                onClick={() => setOrderToBook(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {bookingSuccessMsg ? (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>{bookingSuccessMsg}</span>
              </div>
            ) : (
              <>
                <div className="bg-black/30 p-4 rounded-xl border border-white/15 space-y-2 text-xs font-sans">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Invoice Number:</span>
                    <span className="font-mono-numbers font-bold text-white">
                      {orderToBook.invoiceNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recipient Name:</span>
                    <span className="font-semibold text-white">{orderToBook.customer.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono-numbers font-semibold text-white">
                      {orderToBook.customer.phone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery Address:</span>
                    <span className="text-right text-slate-200 font-medium max-w-xs">
                      {orderToBook.customer.address}, {orderToBook.customer.district}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2 font-bold">
                    <span className="text-slate-300">COD Collection Amount:</span>
                    <span className="text-amber-300 font-mono-numbers text-sm">
                      {orderToBook.payment.status === 'COLLECTED'
                        ? '৳0 (Prepaid)'
                        : formatBDT(orderToBook.financials.totalPayable)}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-300 flex items-center gap-1.5 bg-blue-500/15 p-2.5 rounded-lg border border-blue-500/30">
                  <Info className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>
                    Mode:{' '}
                    <strong className="text-white">
                      {steadfastSettings.isSandboxMode
                        ? 'Sandbox (Test consignment creation)'
                        : 'Official Live API (Steadfast Portal)'}
                    </strong>
                    . Idempotency guarantees prevent duplicate booking.
                  </span>
                </div>

                {bookingError && (
                  <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setOrderToBook(null)}
                    disabled={isBookingLoading}
                    className="px-4 py-2 border border-white/15 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteBooking}
                    disabled={isBookingLoading}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.3)] disabled:opacity-50"
                  >
                    {isBookingLoading ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sending to Steadfast...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 text-slate-950" />
                        <span>Confirm & Dispatch Parcel</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Steadfast Courier Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveSettings}
            className="glass-panel-elevated rounded-2xl max-w-lg w-full p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/20 space-y-4 text-slate-100 relative overflow-hidden"
          >
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Steadfast Courier API Settings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {settingsNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{settingsNotice}</span>
              </div>
            )}

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Official Steadfast API Documentation Guidelines:
                </span>
                <p className="text-[11px] leading-relaxed">
                  Endpoint: <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">POST https://portal.steadfast.com.bd/api/v1/create_order</code> with <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">Api-Key</code> &amp; <code className="bg-amber-100 px-1 py-0.2 rounded font-mono">Secret-Key</code> headers. In production, keep API secrets in server environment variables or Firebase Cloud Functions.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Operating Mode
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={steadfastSettings.isSandboxMode}
                      onChange={() =>
                        setSteadfastSettings({ ...steadfastSettings, isSandboxMode: true })
                      }
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium text-slate-700">
                      Sandbox / Test Mode (Simulate without Live API charges)
                    </span>
                  </label>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={!steadfastSettings.isSandboxMode}
                      onChange={() =>
                        setSteadfastSettings({ ...steadfastSettings, isSandboxMode: false })
                      }
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-medium text-slate-700">
                      Official Live Production API
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Steadfast API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter Steadfast API Key"
                  value={steadfastSettings.apiKey}
                  onChange={(e) =>
                    setSteadfastSettings({ ...steadfastSettings, apiKey: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Steadfast Secret Key
                </label>
                <input
                  type="password"
                  placeholder="Enter Steadfast Secret Key"
                  value={steadfastSettings.secretKey}
                  onChange={(e) =>
                    setSteadfastSettings({ ...steadfastSettings, secretKey: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Inside Dhaka Fee (৳)
                  </label>
                  <input
                    type="number"
                    value={steadfastSettings.defaultRateInsideDhaka}
                    onChange={(e) =>
                      setSteadfastSettings({
                        ...steadfastSettings,
                        defaultRateInsideDhaka: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono-numbers"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Outside Dhaka Fee (৳)
                  </label>
                  <input
                    type="number"
                    value={steadfastSettings.defaultRateOutsideDhaka}
                    onChange={(e) =>
                      setSteadfastSettings({
                        ...steadfastSettings,
                        defaultRateOutsideDhaka: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono-numbers"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                Save Settings
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
