import React, { useState } from 'react';
import {
  X,
  Edit2,
  Boxes,
  History,
  Check,
  AlertTriangle,
  Layers,
  Tag,
  ShieldCheck,
  QrCode,
  ShoppingBag,
  Printer,
} from 'lucide-react';
import { Product, StockMovement } from '../../types';
import { formatBDT, formatBDDate } from '../../services/dataService';

interface ProductDetailDrawerProps {
  product: Product | null;
  onClose: () => void;
  onEdit: (product: Product) => void;
  onAddStock: (product: Product) => void;
  movements: StockMovement[];
  onPrintSticker?: (product: Product) => void;
  onSellProduct?: (product: Product) => void;
}

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  product,
  onClose,
  onEdit,
  onAddStock,
  movements,
  onPrintSticker,
  onSellProduct,
}) => {
  if (!product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const productMovements = movements.filter((m) => m.productId === product.id);

  const isLowStock = product.currentStock <= product.lowStockThreshold && product.currentStock > 0;
  const isOutOfStock = product.currentStock === 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md">
      <div className="w-full max-w-xl glass-panel-elevated h-full shadow-2xl flex flex-col border-l border-white/20 text-slate-100 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2">
            <span className="font-mono-numbers px-2.5 py-1 glass-card text-emerald-300 border border-emerald-400/40 rounded-lg font-bold text-xs tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              {product.productCode}
            </span>
            <span className="text-xs text-slate-500 font-medium truncate">{product.category}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onEdit(product)}
              className="p-1.5 text-slate-400 hover:text-white glass-card rounded-lg transition-colors cursor-pointer"
              title="Edit product"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Main Gallery */}
          <div className="space-y-2">
            <div className="w-full aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
              <img
                src={product.images[activeImageIndex] || '/src/assets/images/three_piece_royal_floral_1792247226094.jpg'}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIndex === idx ? 'border-amber-500 scale-95' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title & Status */}
          <div>
            <h2 className="font-serif-brand font-bold text-lg text-slate-900">{product.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-600">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                <Tag className="w-3 h-3 text-slate-400" />
                {product.color}
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                <Layers className="w-3 h-3 text-slate-400" />
                {product.size}
              </span>
            </div>
          </div>

          {/* Inventory Health Box */}
          <div className={`p-4 rounded-xl border ${
            isOutOfStock
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : isLowStock
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                {isOutOfStock ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                ) : isLowStock ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-600" />
                )}
                <span>
                  {isOutOfStock
                    ? 'Out of Stock'
                    : isLowStock
                    ? 'Low Stock Warning'
                    : 'In Stock & Ready'}
                </span>
              </div>
              <span className="font-mono-numbers text-base font-bold">
                {product.currentStock} pieces
              </span>
            </div>

            <div className="mt-2 w-full bg-white/70 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isOutOfStock ? 'bg-rose-500 w-0' : isLowStock ? 'bg-amber-500' : 'bg-emerald-600'
                }`}
                style={{
                  width: `${Math.min(100, (product.currentStock / (product.lowStockThreshold * 2.5 || 25)) * 100)}%`,
                }}
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] opacity-80">
              <span>Threshold: {product.lowStockThreshold} pcs</span>
              <span>Initial inward: {product.initialStock} pcs</span>
            </div>

            <button
              onClick={() => onAddStock(product)}
              className="mt-3 w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Boxes className="w-4 h-4" />
              <span>Add Stock / Batch Inward</span>
            </button>

            {/* Quick Action Grid: Sticker & Live POS Sell */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              {onPrintSticker && (
                <button
                  onClick={() => onPrintSticker(product)}
                  className="py-2 px-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-xs"
                >
                  <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                  <span>🏷️ স্টিকার ও QR প্রিন্ট</span>
                </button>
              )}

              {onSellProduct && (
                <button
                  onClick={() => onSellProduct(product)}
                  className="py-2 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-xs"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                  <span>⚡ সরাসরি বিক্রি</span>
                </button>
              )}
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-4 glass-card rounded-xl space-y-3 border border-white/10">
            <h4 className="font-semibold text-white text-xs">Cost & Pricing Configuration</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-black/40 border border-white/10 rounded-xl">
                <span className="text-[11px] text-slate-400 block">Purchase Cost per Unit</span>
                <span className="text-base font-bold text-white font-mono-numbers">
                  {formatBDT(product.purchaseCost)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Wholesale / Production cost</span>
              </div>

              <div className="p-3 bg-black/40 border border-white/10 rounded-xl">
                <span className="text-[11px] text-slate-400 block">Default Selling Price</span>
                <span className="text-base font-bold text-emerald-300 font-mono-numbers">
                  {product.defaultSellingPrice !== null && product.defaultSellingPrice !== undefined
                    ? formatBDT(product.defaultSellingPrice)
                    : 'Not set (Variable)'}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Editable per invoice/sale</span>
              </div>
            </div>

            {product.defaultSellingPrice && product.defaultSellingPrice > product.purchaseCost && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg flex items-center justify-between font-medium">
                <span>Estimated Margin:</span>
                <span className="font-mono-numbers font-bold">
                  {formatBDT(product.defaultSellingPrice - product.purchaseCost)} (
                  {Math.round(
                    ((product.defaultSellingPrice - product.purchaseCost) / product.purchaseCost) * 100
                  )}
                  %)
                </span>
              </div>
            )}
          </div>

          {/* Notes */}
          {product.notes && (
            <div className="space-y-1.5">
              <h4 className="font-semibold text-slate-800 text-xs">Fabric & Artisan Details</h4>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                {product.notes}
              </p>
            </div>
          )}

          {/* Item Movement History */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 text-xs flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Stock Movement Ledger ({productMovements.length})</span>
              </h4>
              <span className="text-[10px] text-slate-400">Audited</span>
            </div>

            {productMovements.length === 0 ? (
              <p className="text-slate-400 text-center py-4 bg-slate-50 rounded-lg">No stock movements recorded yet.</p>
            ) : (
              <div className="space-y-2">
                {productMovements.map((mov) => (
                  <div
                    key={mov.id}
                    className="p-3 border border-slate-200 rounded-lg bg-white flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 truncate">{mov.reason}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                          {mov.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatBDDate(mov.timestamp)} · By {mov.user}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <span
                        className={`font-mono-numbers font-bold text-xs ${
                          mov.change > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {mov.change > 0 ? `+${mov.change}` : mov.change} pcs
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono-numbers">
                        Bal: {mov.newStock}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
