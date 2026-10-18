import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Boxes,
  Eye,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  AlertTriangle,
  Tag,
  Sparkles,
  Shirt,
  ShoppingBag,
} from 'lucide-react';
import { Product } from '../../types';
import { formatBDT } from '../../services/dataService';

interface ProductsViewProps {
  products: Product[];
  onOpenAddModal: () => void;
  onEditProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
  onAddStockForProduct: (product: Product) => void;
  onSellProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  searchQuery?: string;
}

export const ProductsView: React.FC<ProductsViewProps> = ({
  products,
  onOpenAddModal,
  onEditProduct,
  onViewProduct,
  onAddStockForProduct,
  onSellProduct,
  onDeleteProduct,
  searchQuery = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'code' | 'stock' | 'cost'>('code');

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const query = searchTerm.toLowerCase().trim();
        const matchesSearch =
          !query ||
          p.productCode.toLowerCase().includes(query) ||
          p.name.toLowerCase().includes(query) ||
          p.color.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query);

        const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;

        let matchesStock = true;
        if (stockFilter === 'IN_STOCK') matchesStock = p.currentStock > p.lowStockThreshold;
        if (stockFilter === 'LOW_STOCK') matchesStock = p.currentStock <= p.lowStockThreshold && p.currentStock > 0;
        if (stockFilter === 'OUT_OF_STOCK') matchesStock = p.currentStock === 0;

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'code') return a.productCode.localeCompare(b.productCode);
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stock') return b.currentStock - a.currentStock;
        if (sortBy === 'cost') return b.purchaseCost - a.purchaseCost;
        return 0;
      });
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy]);

  const lowStockCount = products.filter(
    (p) => p.currentStock <= p.lowStockThreshold && p.currentStock > 0
  ).length;
  const outOfStockCount = products.filter((p) => p.currentStock === 0).length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Filter Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Product Code (e.g. RP-001), name, or color..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 glass-input rounded-xl text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action buttons & View mode */}
          <div className="flex items-center gap-2 justify-end">
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] border border-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                  viewMode === 'table'
                    ? 'bg-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] border border-white/20'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] border border-emerald-400/40 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add 3-Piece</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs">
          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setStockFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                stockFilter === 'ALL'
                  ? 'bg-white/20 text-white border border-white/25 shadow-sm'
                  : 'glass-card text-slate-400 hover:text-white'
              }`}
            >
              All Items ({products.length})
            </button>
            <button
              onClick={() => setStockFilter('IN_STOCK')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                stockFilter === 'IN_STOCK'
                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'glass-card text-emerald-400/70 hover:text-emerald-300'
              }`}
            >
              In Stock ({products.filter((p) => p.currentStock > p.lowStockThreshold).length})
            </button>
            <button
              onClick={() => setStockFilter('LOW_STOCK')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                stockFilter === 'LOW_STOCK'
                  ? 'bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'glass-card text-amber-400/70 hover:text-amber-300'
              }`}
            >
              Low Stock Alert ({lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('OUT_OF_STOCK')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                stockFilter === 'OUT_OF_STOCK'
                  ? 'bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'glass-card text-rose-400/70 hover:text-rose-300'
              }`}
            >
              Out of Stock ({outOfStockCount})
            </button>
          </div>

          {/* Category & Sorting */}
          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 glass-input rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900 text-white">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900 text-white">
                  {c}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 glass-input rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
            >
              <option value="code" className="bg-slate-900 text-white">Sort: Product Code</option>
              <option value="name" className="bg-slate-900 text-white">Sort: Name</option>
              <option value="stock" className="bg-slate-900 text-white">Sort: Stock Level</option>
              <option value="cost" className="bg-slate-900 text-white">Sort: Purchase Cost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Catalog View */}
      {filteredProducts.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-white/10 space-y-3">
          <Tag className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-sm font-bold text-white">No 3-Piece Products Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No products matched your search or filters. Try adjusting your query or create a new product.
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            Add New Product
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => {
            const isLow = product.currentStock <= product.lowStockThreshold && product.currentStock > 0;
            const isOut = product.currentStock === 0;

            return (
              <div
                key={product.id}
                className="glass-card glass-shine-top rounded-2xl border border-white/10 overflow-hidden flex flex-col group relative"
              >
                {/* Image Container with Badge */}
                <div
                  onClick={() => onViewProduct(product)}
                  className="relative aspect-4/3 bg-black/40 overflow-hidden cursor-pointer"
                >
                  <img
                    src={product.images[0] || '/src/assets/images/three_piece_royal_floral_1792247226094.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />

                  {/* Top Left: Product Code Badge */}
                  <div className="absolute top-2.5 left-2.5 glass-panel-elevated text-white text-[11px] font-bold font-mono-numbers px-2.5 py-0.5 rounded-lg border border-white/20 shadow-md tracking-wider">
                    {product.productCode}
                  </div>

                  {/* Multi-image indicator */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-2.5 left-2.5 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-md backdrop-blur-md font-medium border border-white/10">
                      +{product.images.length - 1} photos
                    </div>
                  )}

                  {/* Stock status indicator */}
                  <div className="absolute top-2.5 right-2.5">
                    {isOut ? (
                      <span className="bg-rose-500/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-rose-400/30 shadow-md">
                        Out of Stock
                      </span>
                    ) : isLow ? (
                      <span className="bg-amber-500/90 backdrop-blur-md text-slate-950 text-[10px] font-bold px-2.5 py-0.5 rounded-lg border border-amber-300 shadow-md">
                        Low Stock ({product.currentStock})
                      </span>
                    ) : (
                      <span className="bg-emerald-600/80 backdrop-blur-md text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-lg border border-emerald-400/30 shadow-md">
                        {product.currentStock} in stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] text-emerald-400/90 font-medium block truncate">
                      {product.category} · {product.color}
                    </span>
                    <h4
                      onClick={() => onViewProduct(product)}
                      className="font-bold text-white text-sm hover:text-emerald-300 transition-colors cursor-pointer line-clamp-1 mt-0.5"
                    >
                      {product.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">{product.size}</p>
                  </div>

                  {/* Financials & Stock Bar */}
                  <div className="pt-2.5 border-t border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Purchase Cost</span>
                        <span className="font-bold text-white font-mono-numbers">
                          {formatBDT(product.purchaseCost)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">Default Price</span>
                        <span className="font-semibold text-emerald-300 font-mono-numbers">
                          {product.defaultSellingPrice !== null && product.defaultSellingPrice !== undefined
                            ? formatBDT(product.defaultSellingPrice)
                            : 'Unset'}
                        </span>
                      </div>
                    </div>

                    {/* Stock level visual bar */}
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span>Stock: <strong className="font-mono-numbers text-white">{product.currentStock} pcs</strong></span>
                        <span>Alert: {product.lowStockThreshold} pcs</span>
                      </div>
                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isOut ? 'bg-rose-500 w-0' : isLow ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
                          }`}
                          style={{
                            width: `${Math.min(100, (product.currentStock / (product.lowStockThreshold * 2.5 || 25)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2.5 flex items-center justify-between gap-1.5 border-t border-white/10">
                    <button
                      onClick={() => onSellProduct(product)}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-slate-950 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                      title="Sell this item"
                    >
                      <ShoppingBag className="w-4 h-4 text-slate-950" />
                      <span>Sell</span>
                    </button>

                    <button
                      onClick={() => onAddStockForProduct(product)}
                      className="py-1.5 px-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer"
                      title="Add stock / restock batch"
                    >
                      <Boxes className="w-3.5 h-3.5 text-emerald-400" />
                      <span>+ Stock</span>
                    </button>

                    <button
                      onClick={() => onViewProduct(product)}
                      className="p-1.5 text-slate-400 hover:text-white glass-card hover:border-white/30 rounded-xl transition-colors cursor-pointer"
                      title="View details & specs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onEditProduct(product)}
                      className="p-1.5 text-slate-400 hover:text-white glass-card hover:border-white/30 rounded-xl transition-colors cursor-pointer"
                      title="Edit product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onDeleteProduct(product)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 glass-card hover:border-rose-500/40 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                      title="Delete product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase font-semibold tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Product Code & Name</th>
                  <th className="py-3 px-4">Category / Color</th>
                  <th className="py-3 px-4 text-right">Purchase Cost</th>
                  <th className="py-3 px-4 text-right">Default Selling Price</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((product) => {
                  const isLow = product.currentStock <= product.lowStockThreshold && product.currentStock > 0;
                  const isOut = product.currentStock === 0;

                  return (
                    <tr key={product.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.images[0] || '/src/assets/images/three_piece_royal_floral_1792247226094.jpg'}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <span className="font-mono-numbers font-bold text-white text-xs">
                              {product.productCode}
                            </span>
                            <p
                              onClick={() => onViewProduct(product)}
                              className="font-medium text-slate-200 hover:text-emerald-300 cursor-pointer truncate max-w-xs"
                            >
                              {product.name}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        <span className="block font-medium text-white">{product.category}</span>
                        <span className="text-[11px] text-slate-400">{product.color} · {product.size}</span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono-numbers font-bold text-white">
                        {formatBDT(product.purchaseCost)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono-numbers text-emerald-300">
                        {product.defaultSellingPrice !== null && product.defaultSellingPrice !== undefined
                          ? formatBDT(product.defaultSellingPrice)
                          : <span className="text-slate-500 italic">Unset</span>}
                      </td>

                      <td className="py-3 px-4 text-center font-mono-numbers font-bold text-white text-sm">
                        {product.currentStock}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {isOut ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Low ({product.currentStock})
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Healthy
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSellProduct(product)}
                            className="px-3 py-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600 text-slate-950 rounded-lg text-xs font-black cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
                            title="Sell item"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-950" />
                            <span>Sell</span>
                          </button>
                          <button
                            onClick={() => onAddStockForProduct(product)}
                            className="px-2.5 py-1 bg-white/10 border border-white/20 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            title="Add stock"
                          >
                            + Stock
                          </button>
                          <button
                            onClick={() => onViewProduct(product)}
                            className="p-1.5 text-slate-400 hover:text-white glass-card rounded-lg cursor-pointer"
                            title="View specs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditProduct(product)}
                            className="p-1.5 text-slate-400 hover:text-white glass-card rounded-lg cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteProduct(product)}
                            className="p-1.5 text-rose-400 hover:text-rose-300 glass-card hover:bg-rose-500/20 rounded-lg cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
