import React, { useState, useMemo } from 'react';
import {
  Boxes,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  ShoppingCart,
  Plus,
  ArrowUpRight,
  Sparkles,
  Shirt,
  PackageCheck,
  CheckCircle2,
} from 'lucide-react';
import { Product, StockMovement, PageId, BrandSettings, SaleOrder } from '../../types';
import { formatBDT } from '../../services/dataService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { subDays, parseISO, format } from 'date-fns';

interface DashboardViewProps {
  products: Product[];
  movements: StockMovement[];
  brandSettings: BrandSettings;
  orders?: SaleOrder[];
  onNavigate: (page: PageId) => void;
  onOpenAddProduct: () => void;
  onOpenAddStockForProduct: (product: Product) => void;
  onViewProduct: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  brandSettings,
  orders = [],
  onNavigate,
  onOpenAddProduct,
  onOpenAddStockForProduct,
  onViewProduct,
}) => {
  const [dateRange, setDateRange] = useState<number>(7);

  const totalStockUnits = products.reduce((acc, p) => acc + p.currentStock, 0);
  const totalValuationCost = products.reduce((acc, p) => acc + p.purchaseCost * p.currentStock, 0);
  const totalSellingValuation = products.reduce((acc, p) => acc + (p.defaultSellingPrice || p.purchaseCost * 1.35) * p.currentStock, 0);
  const lowStockProducts = products.filter((p) => p.currentStock <= p.lowStockThreshold && p.currentStock > 0);
  const outOfStockProducts = products.filter((p) => p.currentStock === 0);
  const totalAlertCount = lowStockProducts.length + outOfStockProducts.length;

  const chartData = useMemo(() => {
    const data: Record<string, { sales: number; profit: number }> = {};
    const endDate = new Date();

    for (let i = dateRange - 1; i >= 0; i--) {
      const date = format(subDays(endDate, i), 'yyyy-MM-dd');
      data[date] = { sales: 0, profit: 0 };
    }

    orders.filter(o => o.status !== 'CANCELLED').forEach(o => {
      const date = format(parseISO(o.createdAt), 'yyyy-MM-dd');
      if (data[date]) {
        data[date].sales += (o.financials.subtotal - o.financials.orderDiscount);
        data[date].profit += o.financials.netProfit;
      }
    });

    return Object.keys(data).sort().map(date => ({
      date: format(parseISO(date), 'MMM dd'),
      rawDate: date,
      sales: data[date].sales,
      profit: data[date].profit,
      margin: data[date].sales > 0 ? ((data[date].profit / data[date].sales) * 100).toFixed(1) : '0',
    }));
  }, [orders, dateRange]);

  const totalNetRevenue = chartData.reduce((acc, d) => acc + d.sales, 0);
  const totalNetProfit = chartData.reduce((acc, d) => acc + d.profit, 0);
  const overallMargin = totalNetRevenue > 0 ? ((totalNetProfit / totalNetRevenue) * 100).toFixed(1) : '0';

  // Custom Glass Tooltip for the Recharts BarChart
  const CustomGlassTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const salesVal = payload.find((p: any) => p.dataKey === 'sales')?.value || 0;
      const profitVal = payload.find((p: any) => p.dataKey === 'profit')?.value || 0;
      const marginVal = salesVal > 0 ? ((profitVal / salesVal) * 100).toFixed(1) : '0';

      return (
        <div className="glass-panel-elevated p-3.5 rounded-xl border border-white/20 shadow-[0_15px_35px_rgba(0,0,0,0.6)] space-y-2 min-w-[190px]">
          <div className="text-xs font-bold text-slate-300 pb-1 border-b border-white/10 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-emerald-400 font-mono-numbers">Margin: {marginVal}%</span>
          </div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Total Sales:
              </span>
              <span className="font-bold text-white font-mono-numbers">{formatBDT(salesVal)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                Net Profit:
              </span>
              <span className="font-bold text-sky-300 font-mono-numbers">{formatBDT(profitVal)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Today's Sales */}
        <div className="glass-card glass-shine-top p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-300" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Sales</span>
              <div className="text-2xl font-extrabold font-mono-numbers text-white mt-1.5 tracking-tight">
                {formatBDT(orders.filter(o => format(parseISO(o.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && o.status !== 'CANCELLED').reduce((acc, o) => acc + (o.financials.subtotal - o.financials.orderDiscount), 0))}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>
        </div>
        {/* Today's Profit */}
        <div className="glass-card glass-shine-top p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-all duration-300" />
          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Today's Profit</span>
              <div className="text-2xl font-extrabold font-mono-numbers text-white mt-1.5 tracking-tight">
                {formatBDT(orders.filter(o => format(parseISO(o.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && o.status !== 'CANCELLED').reduce((acc, o) => acc + o.financials.netProfit, 0))}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sky-400 shadow-inner shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
        {/* Spacer for 3-col layout */}
        <div className="hidden lg:block"></div>

        {/* Existing KPIs */}
        <div className="col-span-1 sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stock Valuation */}
          <div className="glass-card glass-shine-top p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-300" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Stock Valuation</span>
                <div className="text-2xl font-extrabold font-mono-numbers text-white mt-1.5 tracking-tight">
                  {formatBDT(totalValuationCost)}
                </div>
                <div className="text-[11px] text-emerald-400/90 font-medium mt-1 flex items-center gap-1">
                  <span>Sale Potential: {formatBDT(totalSellingValuation)}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Stock Units */}
          <div className="glass-card glass-shine-top p-5 rounded-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-sky-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-sky-500/20 transition-all duration-300" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Inventory Units</span>
                <div className="text-2xl font-extrabold font-mono-numbers text-white mt-1.5 tracking-tight">
                  {totalStockUnits.toLocaleString()} <span className="text-sm font-normal text-slate-400">pcs</span>
                </div>
                <div className="text-[11px] text-sky-400/90 font-medium mt-1 flex items-center gap-1">
                  <span>{products.length} Active 3-Piece Designs</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sky-400 shadow-inner shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Stock Alerts */}
          <div 
            onClick={() => onNavigate('stock')} 
            className="glass-card glass-shine-top p-5 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-amber-400/40"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/25 transition-all duration-300" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Critical Stock Alerts</span>
                <div className="text-2xl font-extrabold font-mono-numbers text-amber-300 mt-1.5 tracking-tight flex items-center gap-2">
                  <span>{totalAlertCount}</span>
                  {totalAlertCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Needs Restock
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 font-medium mt-1">
                  <span>{outOfStockProducts.length} Out · {lowStockProducts.length} Low Threshold</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Sales & Profit */}
          <div 
            onClick={() => onNavigate('sales')} 
            className="glass-card glass-shine-top p-5 rounded-2xl relative overflow-hidden group cursor-pointer hover:border-emerald-400/40"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/30 transition-all duration-300" />
            <div className="flex items-start justify-between relative z-10">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Period Revenue</span>
                <div className="text-2xl font-extrabold font-mono-numbers text-emerald-300 mt-1.5 tracking-tight">
                  {formatBDT(totalNetRevenue)}
                </div>
                <div className="text-[11px] text-emerald-400/90 font-medium mt-1 flex items-center gap-1.5">
                  <span className="font-semibold text-white">Profit: +{formatBDT(totalNetProfit)}</span>
                  <span className="text-slate-400">({overallMargin}%)</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section with Recharts */}
      <div className="glass-panel rounded-2xl p-6 border border-white/10 space-y-6 relative overflow-hidden">
        {/* Specular top highlight */}
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <span>Sales & Profit Analytics Ledger</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Interactive grouped daily performance with automated profit margin computation
            </p>
          </div>

          {/* Segmented Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
            {[
              { days: 7, label: 'Last 7 Days' },
              { days: 14, label: '14 Days' },
              { days: 30, label: '30 Days' },
            ].map((tab) => (
              <button
                key={tab.days}
                onClick={() => setDateRange(tab.days)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dateRange === tab.days
                    ? 'bg-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] border border-white/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Recharts BarChart */}
        <div className="h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGlassGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#047857" stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="profitGlassGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `৳${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`}
              />
              <Tooltip content={<CustomGlassTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }} />
              <Bar 
                dataKey="sales" 
                name="Sales (৳)" 
                fill="url(#salesGlassGradient)" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={32}
              />
              <Bar 
                dataKey="profit" 
                name="Profit (৳)" 
                fill="url(#profitGlassGradient)" 
                radius={[6, 6, 0, 0]} 
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Legend / Metrics Summary Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
              <span className="text-slate-300 font-medium">Sales Revenue</span>
              <span className="font-bold font-mono-numbers text-white">({formatBDT(totalNetRevenue)})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.7)]" />
              <span className="text-slate-300 font-medium">Net Profit</span>
              <span className="font-bold font-mono-numbers text-sky-300">({formatBDT(totalNetProfit)})</span>
            </div>
          </div>
          <div className="text-slate-400 flex items-center gap-2">
            <span>Aggregated Profit Margin:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold font-mono-numbers">
              {overallMargin}%
            </span>
          </div>
        </div>
      </div>

      {/* Fast Action Panels: Low Stock Alert & Quick Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Watchlist */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Stock Restock Priority Queue</span>
            </h4>
            <button
              onClick={() => onNavigate('stock')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Manage All Stock</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {lowStockProducts.length === 0 && outOfStockProducts.length === 0 ? (
            <div className="p-8 text-center glass-card rounded-xl border border-white/5 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-white">Inventory Healthy</p>
              <p className="text-xs text-slate-400">All 3-piece products have sufficient stock levels above minimum thresholds.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {[...outOfStockProducts, ...lowStockProducts].slice(0, 4).map((prod) => (
                <div 
                  key={prod.id} 
                  className="glass-card p-3 rounded-xl flex items-center justify-between gap-3 hover:border-white/25 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/40 border border-white/10 shrink-0 flex items-center justify-center">
                      {prod.images && prod.images[0] ? (
                        <img src={prod.images[0]} alt={prod.name} className="w-full h-full object-cover" />
                      ) : (
                        <Shirt className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-numbers font-bold text-xs text-white">{prod.productCode}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          prod.currentStock === 0 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {prod.currentStock === 0 ? 'Out of Stock' : `${prod.currentStock} left`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 truncate mt-0.5">{prod.name}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onOpenAddStockForProduct(prod)}
                    className="px-3 py-1.5 glass-card hover:border-emerald-500/40 hover:bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Restock</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Operations Launchpad */}
        <div className="glass-panel rounded-2xl p-5 border border-white/10 space-y-4 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Quick Launchpad</span>
            </h4>
            <p className="text-xs text-slate-400 mt-1">Frequently used operational workflows</p>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => onNavigate('new-sale')}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/30 text-white flex items-center justify-between cursor-pointer transition-all shadow-[0_4px_16px_rgba(16,185,129,0.15)] group"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">New Sale & Invoice Terminal</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            </button>

            <button
              onClick={onOpenAddProduct}
              className="w-full p-3 rounded-xl glass-card hover:border-white/30 text-white flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <Plus className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Add 3-Piece Product</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => onNavigate('courier')}
              className="w-full p-3 rounded-xl glass-card hover:border-white/30 text-white flex items-center justify-between cursor-pointer transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <PackageCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Steadfast Parcel Dispatch</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Brand Flagship:</span>
            <p className="truncate">{brandSettings.address || 'Dhaka, Bangladesh'}</p>
            <p className="text-emerald-400/90 font-mono-numbers">{brandSettings.phone || '+880 1354-234702'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
