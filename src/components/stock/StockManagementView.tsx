import React, { useState, useMemo } from 'react';
import {
  Search,
  Boxes,
  Plus,
  Minus,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
  Calendar,
  Layers,
  Filter,
  QrCode,
  Tag,
} from 'lucide-react';
import { Product, StockMovement, MovementType } from '../../types';
import { DataService, formatBDT, formatBDDate } from '../../services/dataService';

interface StockManagementViewProps {
  products: Product[];
  movements: StockMovement[];
  onStockUpdated: () => void;
  initialSelectedProductId?: string;
  onPrintSticker?: (product: Product) => void;
}

const ADJUSTMENT_REASONS = [
  'Discrepancy / Physical Count Adjustment',
  'Defective / Damaged Piece (Fabric/Stitching/Printing)',
  'Showroom Display / Press Sample Piece',
  'Returned to Artisan / Wholesaler (Supplier Reject)',
  'Customer Exchange Inward (Restocked)',
  'Artisan Unit Wastage Correction',
  'Other Management Audit Correction',
];

export const StockManagementView: React.FC<StockManagementViewProps> = ({
  products,
  movements,
  onStockUpdated,
  initialSelectedProductId,
  onPrintSticker,
}) => {
  // Product Search / Selector State
  const [productSearchInput, setProductSearchInput] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(
    initialSelectedProductId || (products.length > 0 ? products[0].id : '')
  );

  // Active Action Tab: 'RESTOCK' (Add Stock) vs 'ADJUSTMENT' (Audit Correction / Damage)
  const [activeTab, setActiveTab] = useState<'RESTOCK' | 'ADJUSTMENT'>('RESTOCK');

  // Restock Form State
  const [restockQty, setRestockQty] = useState<number | ''>(20);
  const [restockUnitCost, setRestockUnitCost] = useState<number | ''>('');
  const [supplierLot, setSupplierLot] = useState('');
  const [restockNote, setRestockNote] = useState('');

  // Adjustment Form State
  const [adjustDirection, setAdjustDirection] = useState<'ADD' | 'SUBTRACT'>('SUBTRACT');
  const [adjustQty, setAdjustQty] = useState<number | ''>(1);
  const [adjustReason, setAdjustReason] = useState(ADJUSTMENT_REASONS[0]);
  const [adjustNote, setAdjustNote] = useState('');

  // Movement Ledger Filter State
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>('ALL');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Selected Product Details
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || products[0] || null;
  }, [products, selectedProductId]);

  // Sync unit purchase cost default when selected product changes
  React.useEffect(() => {
    if (selectedProduct) {
      setRestockUnitCost(selectedProduct.purchaseCost);
    }
  }, [selectedProduct]);

  // Filtered products for quick selector search
  const filteredProductOptions = useMemo(() => {
    if (!productSearchInput.trim()) return products;
    const term = productSearchInput.toLowerCase();
    return products.filter(
      (p) =>
        p.productCode.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        p.color.toLowerCase().includes(term)
    );
  }, [products, productSearchInput]);

  // Filtered movements for audit history table
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchSearch =
        historySearch.trim() === '' ||
        m.productCode.toLowerCase().includes(historySearch.toLowerCase()) ||
        m.productName.toLowerCase().includes(historySearch.toLowerCase()) ||
        m.reason.toLowerCase().includes(historySearch.toLowerCase()) ||
        (m.note && m.note.toLowerCase().includes(historySearch.toLowerCase()));

      const matchType = historyTypeFilter === 'ALL' || m.type === historyTypeFilter;
      return matchSearch && matchType;
    });
  }, [movements, historySearch, historyTypeFilter]);

  // Handle Restock (Add Stock) Submission
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (restockQty === '' || Number(restockQty) <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid stock quantity greater than 0.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await DataService.addStock({
        productId: selectedProduct.id,
        quantity: Number(restockQty),
        unitPurchaseCost: restockUnitCost !== '' ? Number(restockUnitCost) : selectedProduct.purchaseCost,
        supplierLot: supplierLot.trim() || undefined,
        note: restockNote.trim() || undefined,
      });

      setStatusMessage({
        type: 'success',
        text: `Successfully added ${res.movement.quantity} pieces to ${res.product.productCode} (${res.product.name}). New stock balance: ${res.product.currentStock} pieces.`,
      });

      setRestockQty(10);
      setSupplierLot('');
      setRestockNote('');
      onStockUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to add stock.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Adjustment Submission
  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (adjustQty === '' || Number(adjustQty) <= 0) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid adjustment quantity greater than 0.' });
      return;
    }

    if (adjustDirection === 'SUBTRACT' && Number(adjustQty) > selectedProduct.currentStock) {
      setStatusMessage({
        type: 'error',
        text: `Cannot deduct ${adjustQty} units. Current stock is only ${selectedProduct.currentStock} pieces. Negative stock is forbidden.`,
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);
    try {
      const res = await DataService.adjustStock({
        productId: selectedProduct.id,
        direction: adjustDirection,
        quantity: Number(adjustQty),
        reason: adjustReason,
        note: adjustNote.trim() || undefined,
      });

      setStatusMessage({
        type: 'success',
        text: `Audited adjustment recorded for ${res.product.productCode}. Stock adjusted ${
          res.movement.change > 0 ? `+${res.movement.change}` : res.movement.change
        } pieces. New balance: ${res.product.currentStock} pieces.`,
      });

      setAdjustQty(1);
      setAdjustNote('');
      onStockUpdated();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Failed to adjust stock.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Product Code', 'Product Name', 'Movement Type', 'Quantity', 'Change', 'Previous Stock', 'New Stock', 'Reason', 'Note', 'User'];
    const rows = filteredMovements.map((m) => [
      m.timestamp,
      m.productCode,
      `"${m.productName.replace(/"/g, '""')}"`,
      m.type,
      m.quantity,
      m.change,
      m.previousStock,
      m.newStock,
      `"${m.reason.replace(/"/g, '""')}"`,
      `"${(m.note || '').replace(/"/g, '""')}"`,
      `"${m.user}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `nahar_stock_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Section: Active Product Inspector & Stock Action Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 Cols): Product Selector & Live Inspection Card */}
        <div className="lg:col-span-5 glass-panel rounded-2xl border border-white/10 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Search className="w-4 h-4 text-emerald-400" />
              <span>Select Product to Manage</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono-numbers">{products.length} registered</span>
          </div>

          {/* Quick Product Code Search & Dropdown */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Type Product Code (e.g. RP-001) or name..."
                value={productSearchInput}
                onChange={(e) => setProductSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 glass-input rounded-xl text-xs font-mono-numbers uppercase focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {/* Selector list */}
            <div className="max-h-48 overflow-y-auto divide-y divide-white/10 border border-white/10 rounded-xl bg-black/40">
              {filteredProductOptions.map((p) => {
                const isSelected = selectedProductId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProductId(p.id);
                      setStatusMessage(null);
                    }}
                    className={`w-full p-2.5 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-white/15 text-white font-semibold'
                        : 'hover:bg-white/5 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`font-mono-numbers px-2 py-0.5 rounded-md text-[11px] font-bold shrink-0 ${
                          isSelected ? 'bg-emerald-400 text-slate-950 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-white/10 text-white'
                        }`}
                      >
                        {p.productCode}
                      </span>
                      <span className="truncate">{p.name}</span>
                    </div>
                    <span
                      className={`font-mono-numbers font-semibold text-[11px] shrink-0 ml-2 ${
                        isSelected ? 'text-emerald-300' : p.currentStock <= p.lowStockThreshold ? 'text-amber-400' : 'text-slate-400'
                      }`}
                    >
                      {p.currentStock} pcs
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Product Inspection Display */}
          {selectedProduct ? (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="flex gap-3">
                <img
                  src={selectedProduct.images[0] || '/src/assets/images/three_piece_royal_floral_1792247226094.jpg'}
                  alt={selectedProduct.name}
                  className="w-20 h-20 rounded-xl object-cover border border-white/10 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-numbers font-bold text-white text-xs px-2 py-0.5 glass-card rounded-md border border-white/15">
                      {selectedProduct.productCode}
                    </span>
                    <span className="text-[11px] text-slate-400 truncate">{selectedProduct.category}</span>
                  </div>
                  <h4 className="font-bold text-white text-sm mt-1 truncate">
                    {selectedProduct.name}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {selectedProduct.color} · {selectedProduct.size}
                  </p>
                </div>
              </div>

              {/* Real-time metrics grid for selected product */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                <div className="p-2.5 glass-card rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Purchase Cost</span>
                  <span className="text-xs font-bold text-white font-mono-numbers">
                    {formatBDT(selectedProduct.purchaseCost)}
                  </span>
                </div>

                <div className="p-2.5 glass-card rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Current Stock</span>
                  <span
                    className={`text-xs font-bold font-mono-numbers ${
                      selectedProduct.currentStock <= selectedProduct.lowStockThreshold
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {selectedProduct.currentStock} pcs
                  </span>
                </div>

                <div className="p-2.5 glass-card rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 block">Selling Price</span>
                  <span className="text-xs font-bold text-white font-mono-numbers">
                    {selectedProduct.defaultSellingPrice !== null && selectedProduct.defaultSellingPrice !== undefined
                      ? formatBDT(selectedProduct.defaultSellingPrice)
                      : 'Unset'}
                  </span>
                </div>
              </div>

              {selectedProduct.currentStock <= selectedProduct.lowStockThreshold && (
                <div className="p-2.5 bg-amber-500/15 border border-amber-500/30 rounded-xl text-amber-200 text-[11px] flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    Stock is at or below the alert threshold ({selectedProduct.lowStockThreshold} pcs). Restocking recommended.
                  </span>
                </div>
              )}

              {onPrintSticker && (
                <button
                  type="button"
                  onClick={() => onPrintSticker(selectedProduct)}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-400/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                >
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>🏷️ এই পণ্যের স্মার্ট স্টিকার ও QR প্রিন্ট করুন</span>
                </button>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">No product selected</p>
          )}
        </div>

        {/* Right Column (7 Cols): Stock Action Center (Add Stock vs Adjustment) */}
        <div className="lg:col-span-7 glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          {/* Action Tabs */}
          <div className="flex border-b border-white/10 bg-black/40">
            <button
              onClick={() => {
                setActiveTab('RESTOCK');
                setStatusMessage(null);
              }}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'RESTOCK'
                  ? 'border-emerald-400 text-white bg-white/10 shadow-[inset_0_-2px_10px_rgba(16,185,129,0.2)]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Stock (Restock Inward)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ADJUSTMENT');
                setStatusMessage(null);
              }}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'ADJUSTMENT'
                  ? 'border-amber-400 text-white bg-white/10 shadow-[inset_0_-2px_10px_rgba(245,158,11,0.2)]'
                  : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
              <span>Stock Adjustment & Damage</span>
            </button>
          </div>

          <div className="p-6">
            {/* Status notification */}
            {statusMessage && (
              <div
                className={`mb-5 p-3 rounded-lg text-xs border flex items-center gap-2.5 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {activeTab === 'RESTOCK' ? (
              /* TAB 1: ADD STOCK (RESTOCK) */
              <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
                <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg text-emerald-900 text-[11px]">
                  <strong>Batch Inward:</strong> Adds physical units to active inventory and logs an immutable audit entry with timestamp and batch details.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Quantity to Add (Pieces) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 20"
                      value={restockQty}
                      onChange={(e) => setRestockQty(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono-numbers font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Purchase Cost per Unit (৳)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="650"
                        value={restockUnitCost}
                        onChange={(e) => setRestockUnitCost(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-lg text-xs font-mono-numbers focus:outline-none focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400">Update cost if new batch price changed</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Supplier / Lot Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Baburhat Artisan Lot #44"
                      value={supplierLot}
                      onChange={(e) => setSupplierLot(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Batch Notes / Remarks
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Received pre-shrunk cotton batch"
                      value={restockNote}
                      onChange={(e) => setRestockNote(e.target.value)}
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-xs focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                </div>

                {/* Calculation confirmation */}
                {selectedProduct && restockQty !== '' && Number(restockQty) > 0 && (
                  <div className="p-3 glass-card rounded-xl border border-white/10 flex items-center justify-between font-medium">
                    <span className="text-slate-400">Stock Calculation Preview:</span>
                    <span className="font-mono-numbers text-white">
                      Current ({selectedProduct.currentStock}) + Adding ({restockQty}) ={' '}
                      <strong className="text-emerald-400 text-sm font-bold">
                        {selectedProduct.currentStock + Number(restockQty)} pieces
                      </strong>
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedProduct}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Boxes className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSubmitting ? 'Recording Inward...' : 'Confirm & Add Stock Inward'}</span>
                  </button>
                </div>
              </form>
            ) : (
              /* TAB 2: AUDIT ADJUSTMENT / DAMAGE */
              <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-[11px]">
                  <strong>Audited Stock Adjustment:</strong> Used for physical count discrepancies, damage write-offs, or sample removal. Prevents invalid negative balances.
                </div>

                {/* Direction Selector */}
                <div>
                  <label className="block font-semibold text-slate-300 mb-1.5">
                    Adjustment Direction
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setAdjustDirection('SUBTRACT')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        adjustDirection === 'SUBTRACT'
                          ? 'bg-rose-500/25 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                          : 'glass-card border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Minus className="w-3.5 h-3.5 text-rose-400" />
                      <span>Deduct from Stock (Damage / Loss)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdjustDirection('ADD')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        adjustDirection === 'ADD'
                          ? 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                          : 'glass-card border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Add to Stock (Found / Audit Surplus)</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Adjustment Quantity (Pieces) <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(e.target.value === '' ? '' : Number(e.target.value))}
                      required
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-xs font-mono-numbers font-semibold text-white focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">
                      Mandatory Reason <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                    >
                      {ADJUSTMENT_REASONS.map((reason) => (
                        <option key={reason} value={reason} className="bg-slate-900 text-white">
                          {reason}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Audit Note / Explanation
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Dye discoloration on dupatta noted by inspection; removed from saleable inventory."
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                    className="w-full px-3 py-2 glass-input rounded-xl text-xs focus:ring-1 focus:ring-emerald-400"
                  />
                </div>

                {/* Calculation confirmation */}
                {selectedProduct && adjustQty !== '' && Number(adjustQty) > 0 && (
                  <div className="p-3 glass-card rounded-xl border border-white/10 flex items-center justify-between font-medium">
                    <span className="text-slate-400">Resulting Stock Balance:</span>
                    <span className="font-mono-numbers text-white">
                      {selectedProduct.currentStock}{' '}
                      {adjustDirection === 'SUBTRACT' ? '-' : '+'}{' '}
                      {adjustQty} ={' '}
                      <strong
                        className={`text-sm ${
                          adjustDirection === 'SUBTRACT' && selectedProduct.currentStock - Number(adjustQty) < 0
                            ? 'text-rose-400 font-bold'
                            : 'text-emerald-400 font-bold'
                        }`}
                      >
                        {adjustDirection === 'SUBTRACT'
                          ? selectedProduct.currentStock - Number(adjustQty)
                          : selectedProduct.currentStock + Number(adjustQty)}{' '}
                        pieces
                      </strong>
                    </span>
                  </div>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={
                      isSubmitting ||
                      !selectedProduct ||
                      (adjustDirection === 'SUBTRACT' &&
                        adjustQty !== '' &&
                        selectedProduct.currentStock - Number(adjustQty) < 0)
                    }
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                    <span>{isSubmitting ? 'Recording Adjustment...' : 'Execute Audited Stock Adjustment'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Stock Movement History / Audit Ledger */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        {/* Ledger Header */}
        <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/5">
          <div>
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-400" />
              <span>Full Stock Movement History & Audit Ledger</span>
            </h3>
            <p className="text-xs text-slate-400">
              Immutable chronological record of every piece received, sold, damaged, or adjusted
            </p>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 glass-card hover:border-white/30 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs bg-black/20">
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter by code, name, reason..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 glass-input rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={historyTypeFilter}
              onChange={(e) => setHistoryTypeFilter(e.target.value)}
              className="px-3 py-1.5 glass-input rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Movement Types ({movements.length})</option>
              <option value="INITIAL" className="bg-slate-900 text-white">Initial Inward</option>
              <option value="RESTOCK" className="bg-slate-900 text-white">Restock Inward</option>
              <option value="SALE" className="bg-slate-900 text-white">Sale Deduction</option>
              <option value="DAMAGE" className="bg-slate-900 text-white">Damage / Defect</option>
              <option value="ADJUSTMENT_ADD" className="bg-slate-900 text-white">Adjustment Add</option>
              <option value="ADJUSTMENT_SUBTRACT" className="bg-slate-900 text-white">Adjustment Deduct</option>
              <option value="RETURN" className="bg-slate-900 text-white">Customer Return</option>
            </select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase font-semibold tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Date & BST Time</th>
                <th className="py-3 px-4">Product Code & Item</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4 text-center">Change</th>
                <th className="py-3 px-4 text-center">Balance Transition</th>
                <th className="py-3 px-4">Reason & Audit Notes</th>
                <th className="py-3 px-4 text-right">Authorized User</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No stock movements found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((mov) => {
                  const isPositive = mov.change > 0;
                  return (
                    <tr key={mov.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono-numbers">
                        {formatBDDate(mov.timestamp)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-mono-numbers font-bold text-white px-2 py-0.5 glass-card rounded-md text-[11px] border border-white/10">
                          {mov.productCode}
                        </span>
                        <p className="font-medium text-slate-200 truncate max-w-xs mt-1">
                          {mov.productName}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                            mov.type === 'RESTOCK' || mov.type === 'INITIAL'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : mov.type === 'SALE'
                              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                              : mov.type === 'DAMAGE'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {mov.type.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono-numbers font-bold text-xs whitespace-nowrap">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? `+${mov.change}` : mov.change} pcs
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-mono-numbers text-slate-300 whitespace-nowrap">
                        <span className="text-slate-500">{mov.previousStock}</span>
                        <ArrowRight className="w-3 h-3 inline mx-1.5 text-slate-600" />
                        <span className="font-bold text-white">{mov.newStock} pcs</span>
                      </td>

                      <td className="py-3 px-4 text-slate-300 max-w-xs">
                        <p className="font-medium text-white">{mov.reason}</p>
                        {mov.note && <p className="text-[11px] text-slate-400 mt-0.5 truncate">{mov.note}</p>}
                      </td>

                      <td className="py-3 px-4 text-right text-slate-400 whitespace-nowrap">
                        {mov.user}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
