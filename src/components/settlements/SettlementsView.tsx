import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Upload,
  Download,
  Calendar,
  Truck,
  ShieldCheck,
  X,
  Check,
  Building2,
} from 'lucide-react';
import { SaleOrder, SettlementRecord } from '../../types';
import { formatBDT, formatBDDate } from '../../services/dataService';

interface SettlementsViewProps {
  orders: SaleOrder[];
  settlements: SettlementRecord[];
  onRecordSettlement: (input: {
    settlementReference: string;
    settlementDate: string;
    source: 'Steadfast Portal API' | 'Steadfast CSV Import' | 'Manual Bank Transfer';
    totalPaidAmount: number;
    matchedOrderIds: string[];
    courierDeductions?: number;
    notes?: string;
  }) => Promise<void>;
}

export const SettlementsView: React.FC<SettlementsViewProps> = ({
  orders,
  settlements,
  onRecordSettlement,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Settlement Form State
  const [settlementRef, setSettlementRef] = useState(`STDL-SETT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [settlementDate, setSettlementDate] = useState(new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState<'Steadfast Portal API' | 'Steadfast CSV Import' | 'Manual Bank Transfer'>('Steadfast Portal API');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [courierDeductions, setCourierDeductions] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Active delivered or dispatched orders eligible for settlement
  const eligibleOrders = useMemo(() => {
    return orders.filter(
      (o) => o.status !== 'CANCELLED' && o.status !== 'RETURNED' && o.payment.status === 'COLLECTED'
    );
  }, [orders]);

  // Set of already settled order IDs
  const settledOrderIdsSet = useMemo(() => {
    const set = new Set<string>();
    settlements.forEach((s) => {
      s.matchedOrderIds.forEach((id) => set.add(id));
    });
    return set;
  }, [settlements]);

  // Financial aggregates
  const financialMetrics = useMemo(() => {
    let totalCodExpected = 0;
    let deliveredCodCollected = 0;
    let totalCourierCharges = 0;
    let merchantPayable = 0;
    let totalSettlementsReceived = 0;

    orders.forEach((o) => {
      if (o.status !== 'CANCELLED') {
        totalCodExpected += o.payment.status === 'PENDING_COD' ? o.financials.totalPayable : 0;
        if (o.payment.status === 'COLLECTED' || o.status === 'DELIVERED') {
          deliveredCodCollected += o.financials.totalPayable;
          totalCourierCharges += o.financials.sellerCourierCost;
          merchantPayable += o.financials.totalPayable - o.financials.sellerCourierCost;
        }
      }
    });

    settlements.forEach((s) => {
      totalSettlementsReceived += s.totalPaidAmount;
    });

    const outstandingPayable = Math.max(0, merchantPayable - totalSettlementsReceived);

    return {
      totalCodExpected,
      deliveredCodCollected,
      totalCourierCharges,
      merchantPayable,
      totalSettlementsReceived,
      outstandingPayable,
    };
  }, [orders, settlements]);

  const handleToggleOrderId = (id: string) => {
    if (selectedOrderIds.includes(id)) {
      setSelectedOrderIds(selectedOrderIds.filter((i) => i !== id));
    } else {
      const next = [...selectedOrderIds, id];
      setSelectedOrderIds(next);
      // Auto-sum amount for convenience
      const matched = orders.filter((o) => next.includes(o.id));
      const sum = matched.reduce((acc, o) => acc + (o.financials.totalPayable - o.financials.sellerCourierCost), 0);
      setPaidAmount(sum);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormError(null);
    setSelectedOrderIds([]);
    setPaidAmount('');
    setCourierDeductions('');
    setNotes('');
  };

  const handleSubmitSettlement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlementRef.trim()) {
      setFormError('Settlement reference number is required.');
      return;
    }
    if (selectedOrderIds.length === 0) {
      setFormError('Please select at least one delivered order to reconcile in this settlement.');
      return;
    }
    const amt = Number(paidAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid total paid settlement amount.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      await onRecordSettlement({
        settlementReference: settlementRef.trim(),
        settlementDate,
        source,
        totalPaidAmount: amt,
        matchedOrderIds: selectedOrderIds,
        courierDeductions: Number(courierDeductions) || 0,
        notes: notes.trim(),
      });
      setIsModalOpen(false);
      alert(`Settlement ${settlementRef} successfully recorded and reconciled!`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to record settlement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export Settlement Report CSV
  const exportSettlementReport = () => {
    const headers = [
      'Settlement Ref',
      'Date',
      'Source',
      'Paid Amount (BDT)',
      'Courier Deductions',
      'Matched Orders Count',
      'Recorded By',
      'Notes',
    ];

    const rows = settlements.map((s) => [
      `"${s.settlementReference}"`,
      `"${s.settlementDate}"`,
      `"${s.source}"`,
      s.totalPaidAmount,
      s.courierDeductions,
      s.matchedOrderIds.length,
      `"${s.recordedBy}"`,
      `"${s.notes || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `settlement_reconciliation_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-5 rounded-2xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <span>Courier COD Accounts &amp; Settlement Reconciliation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Track delivered Cash on Delivery collections, courier delivery charges, merchant payables, bank settlements, and statement reconciliations for নাহার দর্জি বাড়ি.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportSettlementReport}
            className="px-3.5 py-2 glass-button text-slate-300 hover:text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Export Report (CSV)</span>
          </button>

          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Settlement</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card glass-shine-top p-4 rounded-xl border border-white/15">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Delivered COD Collected
          </span>
          <div className="text-xl font-bold text-white font-mono-numbers mt-1">
            {formatBDT(financialMetrics.deliveredCodCollected)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Collected by courier riders</span>
        </div>

        <div className="glass-card glass-shine-top p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
            Courier Charges &amp; Fees
          </span>
          <div className="text-xl font-bold text-rose-300 font-mono-numbers mt-1">
            -{formatBDT(financialMetrics.totalCourierCharges)}
          </div>
          <span className="text-[10px] text-rose-400/80 mt-0.5 block">Steadfast delivery commission</span>
        </div>

        <div className="glass-card glass-shine-top p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
            Total Settlements Received
          </span>
          <div className="text-xl font-bold text-emerald-300 font-mono-numbers mt-1">
            {formatBDT(financialMetrics.totalSettlementsReceived)}
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Bank / Mobile wallet remitted</span>
        </div>

        <div className="glass-card glass-shine-top p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
            Outstanding Payable
          </span>
          <div className="text-xl font-bold text-amber-200 font-mono-numbers mt-1">
            {formatBDT(financialMetrics.outstandingPayable)}
          </div>
          <span className="text-[10px] text-amber-300/80 mt-0.5 block">Pending merchant settlement</span>
        </div>
      </div>

      {/* Settlements History Table */}
      <div className="glass-panel rounded-2xl border border-white/15 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white text-xs uppercase tracking-wider">
            Recorded Settlement Statements ({settlements.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Reconciled payments matched against order invoices
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Settlement Reference</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4 text-center">Matched Orders</th>
                <th className="py-3 px-4 text-right">Courier Deductions</th>
                <th className="py-3 px-4 text-right">Net Paid Amount</th>
                <th className="py-3 px-4">Recorded By / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono-numbers">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-sans">
                    No settlements recorded yet. Click "Record New Settlement" to match courier payments.
                  </td>
                </tr>
              ) : (
                settlements.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-3 px-4 font-bold text-white">
                      {s.settlementReference}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatBDDate(s.settlementDate)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {s.source}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-sky-400">
                      {s.matchedOrderIds.length} orders
                    </td>
                    <td className="py-3 px-4 text-right text-rose-400">
                      -{formatBDT(s.courierDeductions)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm">
                      {formatBDT(s.totalPaidAmount)}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <span className="font-bold text-white block">{s.recordedBy}</span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-xs">
                        {s.notes || 'No remarks'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Settlement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitSettlement}
            className="glass-panel-elevated rounded-2xl max-w-2xl w-full p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-white/20 space-y-4 max-h-[90vh] overflow-y-auto text-slate-100 relative overflow-hidden"
          >
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Record Steadfast Settlement Statement &amp; Reconcile Orders
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Settlement Reference / Statement ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STDL-PAY-2026-9921"
                  value={settlementRef}
                  onChange={(e) => setSettlementRef(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg font-mono-numbers text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Settlement Date *</label>
                <input
                  type="date"
                  required
                  value={settlementDate}
                  onChange={(e) => setSettlementDate(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg font-mono-numbers text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Settlement Source *</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0c1222] border border-white/15 rounded-lg text-white focus:outline-none focus:border-emerald-400"
                >
                  <option value="Steadfast Portal API">Steadfast Portal API</option>
                  <option value="Steadfast CSV Import">Steadfast CSV Statement Import</option>
                  <option value="Manual Bank Transfer">Manual Bank / bKash Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Total Remitted Paid Amount (BDT) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 14500"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg font-mono-numbers font-bold text-emerald-400 focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Notes / Bank Reference Details
              </label>
              <input
                type="text"
                placeholder="e.g. EBL Merchant Account deposit ref #9981"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Select Delivered Orders to Reconcile */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-white text-xs">
                  Select Delivered Orders to Cover ({selectedOrderIds.length} selected)
                </label>
                <span className="text-[10px] text-slate-400">
                  Only delivered &amp; collected orders shown
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto border border-white/15 rounded-xl divide-y divide-white/5 bg-black/20">
                {eligibleOrders.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No delivered orders available for reconciliation.
                  </div>
                ) : (
                  eligibleOrders.map((ord) => {
                    const isChecked = selectedOrderIds.includes(ord.id);
                    const isAlreadySettled = settledOrderIdsSet.has(ord.id);
                    const netPayable = ord.financials.totalPayable - ord.financials.sellerCourierCost;

                    return (
                      <div
                        key={ord.id}
                        onClick={() => !isAlreadySettled && handleToggleOrderId(ord.id)}
                        className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                          isAlreadySettled
                            ? 'bg-white/5 opacity-50 cursor-not-allowed'
                            : isChecked
                            ? 'bg-emerald-500/20 border-l-2 border-emerald-400'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            disabled={isAlreadySettled}
                            onChange={() => {}}
                            className="rounded accent-emerald-500"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono-numbers font-bold text-white">
                                {ord.invoiceNumber}
                              </span>
                              <span className="text-slate-300">{ord.customer.name}</span>
                              {isAlreadySettled && (
                                <span className="px-1.5 py-0.2 bg-white/10 text-slate-300 rounded text-[9px] font-bold">
                                  Already Settled
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400">
                              {ord.customer.phone} · {ord.customer.district} · COD: ৳{ord.financials.totalPayable}
                            </span>
                          </div>
                        </div>

                        <div className="text-right font-mono-numbers">
                          <span className="font-bold text-emerald-400 block">
                            Net: {formatBDT(netPayable)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Fee: ৳{ord.financials.sellerCourierCost}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="px-4 py-2 border border-white/15 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || selectedOrderIds.length === 0}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                {isSubmitting ? 'Recording...' : 'Reconcile & Save Settlement'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
