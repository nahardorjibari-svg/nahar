import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Layers,
  Boxes,
  AlertTriangle,
  Download,
  Calendar,
  DollarSign,
  PackageCheck,
  Video,
  RotateCcw,
  ShoppingBag,
  ArrowUpRight,
} from 'lucide-react';
import { Product, SaleOrder, VideoPost, ReturnRecord } from '../../types';
import { formatBDT, formatBDDate } from '../../services/dataService';

interface ReportsViewProps {
  products: Product[];
  orders: SaleOrder[];
  videos: VideoPost[];
  returns: ReturnRecord[];
}

type ReportPeriod = 'TODAY' | 'WEEK' | 'MONTH' | 'CUSTOM';

export const ReportsView: React.FC<ReportsViewProps> = ({
  products,
  orders,
  videos,
  returns,
}) => {
  const [period, setPeriod] = useState<ReportPeriod>('MONTH');
  const [customStartDate, setCustomStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().slice(0, 10));

  // Filter orders by selected period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);

      if (period === 'TODAY') {
        return (
          orderDate.getFullYear() === now.getFullYear() &&
          orderDate.getMonth() === now.getMonth() &&
          orderDate.getDate() === now.getDate()
        );
      }
      if (period === 'WEEK') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return orderDate >= sevenDaysAgo;
      }
      if (period === 'MONTH') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return orderDate >= thirtyDaysAgo;
      }
      if (period === 'CUSTOM') {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return orderDate >= start && orderDate <= end;
      }
      return true;
    });
  }, [orders, period, customStartDate, customEndDate]);

  // Financial aggregates (EXCLUDING cancelled orders)
  const reportStats = useMemo(() => {
    let grossSales = 0;
    let netSalesRevenue = 0;
    let totalCogs = 0;
    let totalExpenses = 0;
    let packagingExpenses = 0;
    let adExpenses = 0;
    let courierExpenses = 0;
    let otherExpenses = 0;
    let unitsSold = 0;
    let collectedCash = 0;
    let outstandingCod = 0;
    let confirmedOrders = 0;

    filteredOrders.forEach((o) => {
      if (o.status !== 'CANCELLED') {
        confirmedOrders += 1;
        grossSales += o.financials.subtotal;
        netSalesRevenue += o.financials.subtotal - o.financials.orderDiscount;
        totalCogs += o.financials.totalCogs;
        totalExpenses += o.financials.totalExpenses;

        packagingExpenses += o.financials.packagingCost || 0;
        adExpenses += o.financials.advertisingCost || 0;
        courierExpenses += Math.max(0, o.financials.sellerCourierCost - o.financials.deliveryFee);
        otherExpenses += o.financials.otherExpenses || 0;

        unitsSold += o.items.reduce((acc, i) => acc + i.quantity, 0);

        if (o.payment.status === 'COLLECTED') {
          collectedCash += o.financials.totalPayable;
        } else if (o.payment.status === 'PENDING_COD') {
          outstandingCod += o.financials.totalPayable;
        }
      }
    });

    const grossProfit = netSalesRevenue - totalCogs;
    const netProfit = grossProfit - totalExpenses;
    const grossMarginPercent = netSalesRevenue > 0 ? Math.round((grossProfit / netSalesRevenue) * 100) : 0;
    const netMarginPercent = netSalesRevenue > 0 ? Math.round((netProfit / netSalesRevenue) * 100) : 0;

    return {
      confirmedOrders,
      grossSales,
      netSalesRevenue,
      totalCogs,
      grossProfit,
      grossMarginPercent,
      totalExpenses,
      packagingExpenses,
      adExpenses,
      courierExpenses,
      otherExpenses,
      netProfit,
      netMarginPercent,
      unitsSold,
      collectedCash,
      outstandingCod,
    };
  }, [filteredOrders]);

  // Overall Stock Valuation (Wholesale assets)
  const totalStockValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + p.purchaseCost * p.currentStock, 0);
  }, [products]);

  const totalStockUnits = useMemo(() => {
    return products.reduce((acc, p) => acc + p.currentStock, 0);
  }, [products]);

  // Best-selling products ranking
  const bestSellers = useMemo(() => {
    const map = new Map<
      string,
      {
        productCode: string;
        productName: string;
        unitsSold: number;
        revenue: number;
        profit: number;
        currentStock: number;
      }
    >();

    filteredOrders.forEach((o) => {
      if (o.status !== 'CANCELLED') {
        o.items.forEach((item) => {
          const current = map.get(item.productCode) || {
            productCode: item.productCode,
            productName: item.productName,
            unitsSold: 0,
            revenue: 0,
            profit: 0,
            currentStock: 0,
          };
          current.unitsSold += item.quantity;
          current.revenue += item.totalAmount;
          current.profit += item.grossProfit;
          map.set(item.productCode, current);
        });
      }
    });

    // Match with current catalog stock
    products.forEach((p) => {
      const entry = map.get(p.productCode);
      if (entry) {
        entry.currentStock = p.currentStock;
      }
    });

    return Array.from(map.values()).sort((a, b) => b.unitsSold - a.unitsSold);
  }, [filteredOrders, products]);

  // Video / Live Campaign Attribution Report
  const videoPerformance = useMemo(() => {
    return videos.map((v) => {
      const linkedOrders = filteredOrders.filter(
        (o) => o.originVideoId === v.id && o.status !== 'CANCELLED'
      );
      const ordersCount = linkedOrders.length;
      const revenue = linkedOrders.reduce(
        (acc, o) => acc + (o.financials.subtotal - o.financials.orderDiscount),
        0
      );
      const grossProfit = linkedOrders.reduce((acc, o) => acc + o.financials.grossProfit, 0);
      const units = linkedOrders.reduce(
        (acc, o) => acc + o.items.reduce((sum, i) => sum + i.quantity, 0),
        0
      );
      const roi = v.adSpend > 0 ? Math.round(((revenue - v.adSpend) / v.adSpend) * 100) : 0;

      return {
        video: v,
        ordersCount,
        revenue,
        grossProfit,
        units,
        roi,
      };
    });
  }, [videos, filteredOrders]);

  // Category Valuation Distribution
  const categoryMap = useMemo(() => {
    const map: { [cat: string]: { units: number; valuation: number } } = {};
    products.forEach((p) => {
      const cat = p.category || 'General';
      if (!map[cat]) map[cat] = { units: 0, valuation: 0 };
      map[cat].units += p.currentStock;
      map[cat].valuation += p.purchaseCost * p.currentStock;
    });
    return Object.entries(map).sort((a, b) => b[1].valuation - a[1].valuation);
  }, [products]);

  // CSV Export for management
  const exportExecutiveReportCsv = () => {
    const summaryRows = [
      ['Nahar Dorjibari — Financial & Executive Report'],
      [`Report Period: ${period} (${new Date().toLocaleDateString('en-GB')})`],
      [''],
      ['METRIC', 'VALUE (BDT)'],
      ['Net Sales Revenue', reportStats.netSalesRevenue],
      ['Cost of Goods Sold (COGS)', reportStats.totalCogs],
      ['Gross Profit', reportStats.grossProfit],
      ['Gross Margin %', `${reportStats.grossMarginPercent}%`],
      ['Total Operating Expenses', reportStats.totalExpenses],
      ['Advertising Cost', reportStats.adExpenses],
      ['Packaging Cost', reportStats.packagingExpenses],
      ['Courier Charges Loss', reportStats.courierExpenses],
      ['Net Profit', reportStats.netProfit],
      ['Net Margin %', `${reportStats.netMarginPercent}%`],
      ['Units Sold (Pieces)', reportStats.unitsSold],
      ['Cash Collected', reportStats.collectedCash],
      ['Outstanding COD (Uncollected)', reportStats.outstandingCod],
      ['Remaining Stock Physical Asset Value', totalStockValuation],
      ['Remaining Stock Units (Pieces)', totalStockUnits],
      [''],
      ['TOP SELLING 3-PIECE PRODUCTS'],
      ['Product Code', 'Product Name', 'Units Sold', 'Total Revenue', 'Gross Profit', 'Remaining Stock'],
      ...bestSellers.map((b) => [
        b.productCode,
        `"${b.productName}"`,
        b.unitsSold,
        b.revenue,
        b.profit,
        b.currentStock,
      ]),
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + summaryRows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `nahar_dorjibari_executive_report_${period}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Date Period Controls */}
      <div className="glass-panel p-5 rounded-2xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-400" />
            <span>Financial Profitability & Stock Reports</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified financial figures: actual selling prices, COGS, expenses, net profit, and uncollected COD
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Period selector */}
          <div className="flex bg-black/40 p-1 rounded-xl text-xs font-semibold border border-white/10">
            {(['TODAY', 'WEEK', 'MONTH', 'CUSTOM'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  period === p
                    ? 'bg-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)] border border-white/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {p === 'TODAY'
                  ? 'Today'
                  : p === 'WEEK'
                  ? '7 Days'
                  : p === 'MONTH'
                  ? '30 Days'
                  : 'Custom'}
              </button>
            ))}
          </div>

          <button
            onClick={exportExecutiveReportCsv}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.3)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Custom Date Pickers */}
      {period === 'CUSTOM' && (
        <div className="p-4 glass-card rounded-xl border border-white/15 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="p-1.5 bg-black/40 text-white border border-white/15 rounded-lg font-mono-numbers focus:outline-none focus:border-amber-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="p-1.5 bg-black/40 text-white border border-white/15 rounded-lg font-mono-numbers focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      )}

      {/* Main Financial KPI Grid (6 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Net Sales */}
        <div className="glass-card glass-shine-top p-4 rounded-xl border border-white/15">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Net Sales Revenue
          </span>
          <div className="text-lg font-bold text-white font-mono-numbers mt-1">
            {formatBDT(reportStats.netSalesRevenue)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
            {reportStats.unitsSold} pcs ({reportStats.confirmedOrders} orders)
          </span>
        </div>

        {/* COGS */}
        <div className="glass-card glass-shine-top p-4 rounded-xl border border-white/15">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            COGS (Purchase Cost)
          </span>
          <div className="text-lg font-bold text-slate-300 font-mono-numbers mt-1">
            {formatBDT(reportStats.totalCogs)}
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block truncate">
            Cost of sold products
          </span>
        </div>

        {/* Gross Profit */}
        <div className="glass-card glass-shine-top p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
            Gross Profit ({reportStats.grossMarginPercent}%)
          </span>
          <div className="text-lg font-bold text-emerald-300 font-mono-numbers mt-1">
            {formatBDT(reportStats.grossProfit)}
          </div>
          <span className="text-[10px] text-emerald-400/80 mt-0.5 block truncate">
            Revenue minus COGS
          </span>
        </div>

        {/* Operating Expenses */}
        <div className="glass-card glass-shine-top p-4 rounded-xl border border-rose-500/30 bg-rose-500/10">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
            Recorded Expenses
          </span>
          <div className="text-lg font-bold text-rose-300 font-mono-numbers mt-1">
            {formatBDT(reportStats.totalExpenses)}
          </div>
          <span className="text-[10px] text-rose-400/80 mt-0.5 block truncate">
            Ads, poly, courier diff
          </span>
        </div>

        {/* Net Profit */}
        <div className="glass-card glass-shine-top p-4 rounded-xl border border-amber-500/30 bg-amber-500/10">
          <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
            Net Profit ({reportStats.netMarginPercent}%)
          </span>
          <div className="text-lg font-bold text-amber-200 font-mono-numbers mt-1">
            {formatBDT(reportStats.netProfit)}
          </div>
          <span className="text-[10px] text-amber-300/80 mt-0.5 block truncate">
            Bottom-line profit
          </span>
        </div>

        {/* Stock Valuation */}
        <div className="glass-card glass-shine-top p-4 rounded-xl border border-white/15">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Stock Assets Valuation
          </span>
          <div className="text-lg font-bold text-white font-mono-numbers mt-1">
            {formatBDT(totalStockValuation)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block truncate">
            {totalStockUnits} pcs remaining
          </span>
        </div>
      </div>

      {/* Cash Flow vs Outstanding COD Alert Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 text-center sm:text-left relative z-10">
          <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
            Cash Collection Discipline Rule
          </span>
          <p className="text-xs text-slate-300 max-w-xl">
            Unpaid Cash on Delivery (COD) shipments are strictly tracked as pending receivables and NEVER counted as collected liquid cash.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0 font-mono-numbers relative z-10">
          <div className="text-right">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">Cash Collected</span>
            <span className="text-base font-bold text-emerald-300">{formatBDT(reportStats.collectedCash)}</span>
          </div>
          <div className="h-8 w-px bg-white/20" />
          <div className="text-right">
            <span className="text-[10px] text-amber-400 uppercase font-bold block">Pending Steadfast COD</span>
            <span className="text-base font-bold text-amber-300">{formatBDT(reportStats.outstandingCod)}</span>
          </div>
        </div>
      </div>

      {/* Two Column Grid: Best-Selling 3-Piece Designs & Video Attribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Best Sellers */}
        <div className="glass-panel rounded-2xl border border-white/15 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white text-xs flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span>Top-Selling 3-Piece Styles</span>
            </h3>
            <span className="text-[11px] text-slate-400">Ranked by volume</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3 text-center">Units Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue (৳)</th>
                  <th className="py-2.5 px-3 text-right">Profit (৳)</th>
                  <th className="py-2.5 px-3 text-center">Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bestSellers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No sales recorded in this period.
                    </td>
                  </tr>
                ) : (
                  bestSellers.slice(0, 6).map((item, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-mono-numbers font-bold text-white block">
                          {item.productCode}
                        </span>
                        <span className="text-[11px] text-slate-400 truncate block max-w-[140px]">
                          {item.productName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-numbers font-bold text-white">
                        {item.unitsSold} pcs
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers font-medium text-slate-200">
                        {formatBDT(item.revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-emerald-400">
                        +{formatBDT(item.profit)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-numbers text-slate-400">
                        {item.currentStock} pcs
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Video & Social Campaign Performance */}
        <div className="glass-panel rounded-2xl border border-white/15 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white text-xs flex items-center gap-2">
              <Video className="w-4 h-4 text-indigo-400" />
              <span>Video & Reel Campaign Attribution</span>
            </h3>
            <span className="text-[11px] text-slate-400">Ad Spend vs Orders</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Campaign / Video</th>
                  <th className="py-2.5 px-3 text-center">Orders</th>
                  <th className="py-2.5 px-3 text-right">Ad Spend</th>
                  <th className="py-2.5 px-3 text-right">Revenue</th>
                  <th className="py-2.5 px-3 text-center">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {videoPerformance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No video campaigns recorded.
                    </td>
                  </tr>
                ) : (
                  videoPerformance.map((vp, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white block truncate max-w-[150px]">
                          {vp.video.title}
                        </span>
                        <span className="text-[10px] text-indigo-400 font-semibold">{vp.video.platform}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-numbers font-bold text-white">
                        {vp.ordersCount} ({vp.units} pcs)
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers text-slate-400">
                        {formatBDT(vp.video.adSpend)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono-numbers font-bold text-white">
                        {formatBDT(vp.revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono-numbers">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            vp.roi > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-white/5 text-slate-400 border border-white/10'
                          }`}
                        >
                          {vp.roi > 0 ? `+${vp.roi}%` : `${vp.roi}%`}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category Capital Asset Share */}
      <div className="glass-panel rounded-2xl border border-white/15 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)]">
        <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
          <h3 className="font-bold text-white text-xs flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Category Capital Asset Distribution</span>
          </h3>
          <span className="text-[11px] text-slate-400">
            Total Inventory: {formatBDT(totalStockValuation)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Fabric / Collection Category</th>
                <th className="py-2.5 px-4 text-center">Available Units</th>
                <th className="py-2.5 px-4 text-right">Total Valuation (৳)</th>
                <th className="py-2.5 px-4 text-right">Asset Share %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categoryMap.map(([cat, data], idx) => {
                const sharePercent =
                  totalStockValuation > 0
                    ? Math.round((data.valuation / totalStockValuation) * 100)
                    : 0;
                return (
                  <tr key={idx} className="hover:bg-white/[0.04] transition-colors">
                    <td className="py-2.5 px-4 font-semibold text-white">{cat}</td>
                    <td className="py-2.5 px-4 text-center font-mono-numbers text-slate-300">
                      {data.units} pcs
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-numbers font-bold text-emerald-400">
                      {formatBDT(data.valuation)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono-numbers font-medium text-slate-400">
                      {sharePercent}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
