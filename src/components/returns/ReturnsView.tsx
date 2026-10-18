import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Plus,
  PackageX,
  Search,
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Filter,
  DollarSign,
  Boxes,
} from 'lucide-react';
import { ReturnRecord, SaleOrder, ReturnReason, Product } from '../../types';
import { formatBDT, formatBDDate } from '../../services/dataService';

interface ReturnsViewProps {
  returns: ReturnRecord[];
  orders: SaleOrder[];
  products: Product[];
  onProcessReturn: (input: {
    orderId: string;
    productCode: string;
    quantityReturned: number;
    reason: ReturnReason;
    itemCondition: 'RESELLABLE' | 'DAMAGED';
    refundAmount: number;
    deductDeliveryFee?: boolean;
    notes?: string;
  }) => Promise<void>;
}

const RETURN_REASONS: ReturnReason[] = [
  'Size / Fitting Issue',
  'Color / Pattern Variation',
  'Fabric or Stitching Defect',
  'Late Delivery',
  'Customer Changed Mind',
  'Damaged in Courier Transit',
  'Other',
];

export const ReturnsView: React.FC<ReturnsViewProps> = ({
  returns,
  orders,
  products,
  onProcessReturn,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [conditionFilter, setConditionFilter] = useState<'ALL' | 'RESELLABLE' | 'DAMAGED'>('ALL');

  // Process Return Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedProductCode, setSelectedProductCode] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<ReturnReason>('Size / Fitting Issue');
  const [itemCondition, setItemCondition] = useState<'RESELLABLE' | 'DAMAGED'>('RESELLABLE');
  const [refundAmount, setRefundAmount] = useState<number | ''>('');
  const [deductDeliveryFee, setDeductDeliveryFee] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Eligible orders (non-cancelled orders)
  const eligibleOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'CANCELLED');
  }, [orders]);

  const activeSelectedOrder = useMemo(() => {
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [orders, selectedOrderId]);

  const activeSelectedOrderItem = useMemo(() => {
    if (!activeSelectedOrder || !selectedProductCode) return null;
    return activeSelectedOrder.items.find((i) => i.productCode === selectedProductCode) || null;
  }, [activeSelectedOrder, selectedProductCode]);

  // Check how many units already returned for this order item
  const alreadyReturnedQty = useMemo(() => {
    if (!selectedOrderId || !selectedProductCode) return 0;
    return returns
      .filter((r) => r.orderId === selectedOrderId && r.productCode === selectedProductCode)
      .reduce((acc, r) => acc + r.quantityReturned, 0);
  }, [returns, selectedOrderId, selectedProductCode]);

  const maxReturnableQty = useMemo(() => {
    if (!activeSelectedOrderItem) return 0;
    return Math.max(0, activeSelectedOrderItem.quantity - alreadyReturnedQty);
  }, [activeSelectedOrderItem, alreadyReturnedQty]);

  // Auto-calculate suggested refund amount when item or quantity changes
  const handleItemSelect = (prodCode: string) => {
    setSelectedProductCode(prodCode);
    const item = activeSelectedOrder?.items.find((i) => i.productCode === prodCode);
    if (item) {
      setQuantity(1);
      const feeDeduction = deductDeliveryFee ? (activeSelectedOrder?.financials.deliveryFee || 0) : 0;
      setRefundAmount(Math.max(0, item.sellingPrice - feeDeduction));
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setFormError(null);
    if (eligibleOrders.length > 0) {
      const first = eligibleOrders[0];
      setSelectedOrderId(first.id);
      if (first.items.length > 0) {
        setSelectedProductCode(first.items[0].productCode);
        setQuantity(1);
        setRefundAmount(first.items[0].sellingPrice);
      }
    }
  };

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedOrderId) {
      setFormError('Please select an order.');
      return;
    }
    if (!selectedProductCode) {
      setFormError('Please select a product from the order.');
      return;
    }
    if (quantity <= 0) {
      setFormError('Quantity must be at least 1.');
      return;
    }
    if (quantity > maxReturnableQty) {
      setFormError(`Cannot return ${quantity} pcs. Maximum returnable is ${maxReturnableQty} pcs.`);
      return;
    }
    if (refundAmount === '' || refundAmount < 0) {
      setFormError('Please enter a valid refund amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onProcessReturn({
        orderId: selectedOrderId,
        productCode: selectedProductCode,
        quantityReturned: Number(quantity),
        reason,
        itemCondition,
        refundAmount: Number(refundAmount),
        deductDeliveryFee,
        notes: notes.trim(),
      });
      setIsModalOpen(false);
      setNotes('');
    } catch (err: any) {
      setFormError(err?.message || 'Failed to process return');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter returns
  const filteredReturns = useMemo(() => {
    return returns.filter((r) => {
      if (conditionFilter !== 'ALL' && r.itemCondition !== conditionFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const q = searchTerm.trim().toLowerCase();
        return (
          r.orderNumber.toLowerCase().includes(q) ||
          r.productCode.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [returns, conditionFilter, searchTerm]);

  // Aggregate stats
  const totalReturnedUnits = returns.reduce((acc, r) => acc + r.quantityReturned, 0);
  const resellableRestockedUnits = returns
    .filter((r) => r.itemCondition === 'RESELLABLE')
    .reduce((acc, r) => acc + r.quantityReturned, 0);
  const damagedUnits = returns
    .filter((r) => r.itemCondition === 'DAMAGED')
    .reduce((acc, r) => acc + r.quantityReturned, 0);
  const totalRefundedBDT = returns.reduce((acc, r) => acc + r.refundAmount, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <span>Returns & Damaged Stock Audit</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict return workflows: only resellable items restock to inventory; damaged pieces are routed to defect ledger
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        >
          <Plus className="w-4 h-4" />
          <span>Process Customer Return</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card glass-shine-top p-4 rounded-xl border border-white/15">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Returned
          </span>
          <div className="text-xl font-bold text-white font-mono-numbers mt-1">
            {totalReturnedUnits} <span className="text-xs font-normal text-slate-400">pcs</span>
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{returns.length} total return events</span>
        </div>

        <div className="glass-card glass-shine-top p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
            Resellable (Restocked)
          </span>
          <div className="text-xl font-bold text-emerald-300 font-mono-numbers mt-1">
            {resellableRestockedUnits} <span className="text-xs font-normal text-emerald-400/80">pcs</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-0.5 block">Safely added back to available stock</span>
        </div>

        <div className="glass-card glass-shine-top p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
          <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
            Damaged (Defect Ledger)
          </span>
          <div className="text-xl font-bold text-rose-300 font-mono-numbers mt-1">
            {damagedUnits} <span className="text-xs font-normal text-rose-400/80">pcs</span>
          </div>
          <span className="text-[10px] text-rose-400/80 mt-0.5 block">Not returned to saleable inventory</span>
        </div>

        <div className="glass-card glass-shine-top p-4 rounded-xl border border-white/15">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Refunded
          </span>
          <div className="text-xl font-bold text-white font-mono-numbers mt-1">
            {formatBDT(totalRefundedBDT)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Disbursed to patrons</span>
        </div>
      </div>

      {/* Filter and Table */}
      <div className="glass-panel rounded-2xl border border-white/15 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative max-w-sm w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Order #, Product, Reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/15 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-medium text-[11px]">Condition:</span>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value as any)}
              className="bg-[#0c1222] border border-white/15 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Conditions</option>
              <option value="RESELLABLE">Resellable Only</option>
              <option value="DAMAGED">Damaged Only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-4">Return Date & ID</th>
                <th className="py-3 px-4">Order / Invoice</th>
                <th className="py-3 px-4">Returned Product</th>
                <th className="py-3 px-4 text-center">Qty</th>
                <th className="py-3 px-4">Reason & Notes</th>
                <th className="py-3 px-4 text-center">Condition</th>
                <th className="py-3 px-4 text-right">Refund Amount</th>
                <th className="py-3 px-4 text-center">Stock Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono-numbers">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RotateCcw className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium text-slate-600">No return records found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Customer returns will appear here with auditable stock movements.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-mono-numbers">
                      <span className="font-bold text-slate-900 block">{ret.id.slice(0, 12)}</span>
                      <span className="text-[10px] text-slate-400">{formatBDDate(ret.createdAt)}</span>
                    </td>

                    <td className="py-3 px-4 font-mono-numbers">
                      <span className="font-bold text-slate-900 block">{ret.orderNumber}</span>
                      <span className="text-[10px] text-slate-500">{ret.invoiceNumber}</span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono-numbers font-bold text-slate-900">{ret.productCode}</div>
                      <div className="text-[11px] text-slate-600">{ret.productName}</div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono-numbers font-bold text-slate-900">
                      {ret.quantityReturned} pcs
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <span className="font-medium text-slate-800 block">{ret.reason}</span>
                      {ret.notes && (
                        <span className="text-[10px] text-slate-500 italic block truncate">
                          "{ret.notes}"
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          ret.itemCondition === 'RESELLABLE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {ret.itemCondition}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right font-mono-numbers font-bold text-slate-900">
                      {formatBDT(ret.refundAmount)}
                    </td>

                    <td className="py-3 px-4 text-center">
                      {ret.restocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Restocked (+{ret.quantityReturned})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          <AlertCircle className="w-3 h-3" />
                          <span>Damaged / Written Off</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Process Return Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 shadow-2xl my-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-slate-900 text-sm">Process Customer Return & Exchange</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitReturn} className="space-y-4">
              {/* Order Selection */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  1. Select Origin Order <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => {
                    setSelectedOrderId(e.target.value);
                    const ord = orders.find((o) => o.id === e.target.value);
                    if (ord && ord.items.length > 0) {
                      handleItemSelect(ord.items[0].productCode);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono-numbers"
                >
                  {eligibleOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} ({o.customer.name} · {formatBDT(o.financials.totalPayable)} · {formatBDDate(o.createdAt)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selection within Order */}
              {activeSelectedOrder && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    2. Select Product Line to Return <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedProductCode}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                  >
                    {activeSelectedOrder.items.map((i, idx) => (
                      <option key={idx} value={i.productCode}>
                        {i.productCode} — {i.productName} (Ordered: {i.quantity} pcs @ ৳{i.sellingPrice})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Return Quantity & Guard */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Return Quantity (pcs)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={maxReturnableQty}
                    value={quantity}
                    onChange={(e) => {
                      const val = Math.max(1, Math.min(maxReturnableQty, Number(e.target.value)));
                      setQuantity(val);
                      if (activeSelectedOrderItem) {
                        setRefundAmount(val * activeSelectedOrderItem.sellingPrice);
                      }
                    }}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-mono-numbers font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Max returnable: <strong>{maxReturnableQty}</strong> pcs
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    Item Condition & Stock Routing <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={itemCondition}
                    onChange={(e) => setItemCondition(e.target.value as any)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  >
                    <option value="RESELLABLE">Resellable (Add to Inventory)</option>
                    <option value="DAMAGED">Damaged (Defect Ledger only)</option>
                  </select>
                  <span className="text-[10px] mt-1 block font-medium">
                    {itemCondition === 'RESELLABLE' ? (
                      <span className="text-emerald-700">✓ Will restore +{quantity} to active catalog stock</span>
                    ) : (
                      <span className="text-rose-700">⚠ Will NOT restore to stock (written off)</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Reason for Return
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
                >
                  {RETURN_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refund Amount */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Refund Amount to Customer (৳) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono-numbers font-bold"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Audit Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Minor stitching loose at neckline, customer exchanged for size 40..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || maxReturnableQty === 0}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? 'Processing Return...' : 'Confirm Return & Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
