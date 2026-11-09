import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Edit,
  Trash2,
  Download,
  RotateCcw,
  Phone,
  MessageCircle,
  MapPin,
  Package,
  Layers,
  Sparkles,
  ArrowRight,
  Truck,
  DollarSign,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { PreOrder, Product, BrandSettings } from '../../types';
import { DataService, formatBDT, formatBDDate } from '../../services/dataService';
import { PreOrderModal } from './PreOrderModal';
import { PreOrderSlipModal } from './PreOrderSlipModal';
import { BD_DISTRICTS } from '../../utils/customerTextParser';

interface PreOrdersViewProps {
  preOrders: PreOrder[];
  products: Product[];
  brandSettings: BrandSettings;
  onRefreshPreOrders: () => void;
  onNewSale?: (productCode?: string) => void;
}

export const PreOrdersView: React.FC<PreOrdersViewProps> = ({
  preOrders,
  products,
  brandSettings,
  onRefreshPreOrders,
}) => {
  // Tab state: 'active' (চলমান প্রি-অর্ডার) vs 'done' (সম্পন্ন প্রি-অর্ডার)
  const [activeTab, setActiveTab] = useState<'active' | 'done'>('active');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPreOrder, setEditingPreOrder] = useState<PreOrder | null>(null);

  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [selectedSlipOrder, setSelectedSlipOrder] = useState<PreOrder | null>(null);

  // Success toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Pre-orders partitioned into Active vs Done
  const activeOrders = useMemo(() => {
    return preOrders.filter((o) => o.status !== 'DONE' && o.status !== 'CANCELLED');
  }, [preOrders]);

  const doneOrders = useMemo(() => {
    return preOrders.filter((o) => o.status === 'DONE');
  }, [preOrders]);

  // Filtered orders according to search & district
  const displayedOrders = useMemo(() => {
    const list = activeTab === 'active' ? activeOrders : doneOrders;
    return list.filter((order) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        order.customerName.toLowerCase().includes(q) ||
        order.phone.includes(q) ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.district.toLowerCase().includes(q) ||
        order.fullAddress.toLowerCase().includes(q) ||
        order.items.some((i) =>
          i.productName.toLowerCase().includes(q) || i.productCode.toLowerCase().includes(q)
        );

      const matchDistrict =
        districtFilter === 'ALL' ||
        order.district.toLowerCase().includes(districtFilter.toLowerCase());

      return matchSearch && matchDistrict;
    });
  }, [activeTab, activeOrders, doneOrders, searchQuery, districtFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = preOrders.length;
    const activeCount = activeOrders.length;
    const doneCount = doneOrders.length;
    const totalAdvance = preOrders.reduce((sum, o) => sum + (o.advancePayment || 0), 0);
    const activeDue = activeOrders.reduce((sum, o) => sum + (o.dueAmount || 0), 0);
    const totalRevenue = preOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    return {
      total,
      activeCount,
      doneCount,
      totalAdvance,
      activeDue,
      totalRevenue,
    };
  }, [preOrders, activeOrders, doneOrders]);

  // Action: Mark Done
  const handleMarkDone = async (id: string) => {
    try {
      await DataService.markPreOrderDone(id);
      onRefreshPreOrders();
      showToast('✅ প্রি-অর্ডারটি সফলভাবে সম্পন্ন হয়েছে এবং "Done Sheet"-এ স্থানান্তরিত হয়েছে!');
    } catch (err) {
      console.error(err);
      alert('স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।');
    }
  };

  // Action: Reopen
  const handleReopen = async (id: string) => {
    try {
      await DataService.reopenPreOrder(id);
      onRefreshPreOrders();
      showToast('↩️ প্রি-অর্ডারটি পুনরায় চলমান শিটে ফেরত আনা হয়েছে!');
    } catch (err) {
      console.error(err);
      alert('রি-ওপেন করতে সমস্যা হয়েছে।');
    }
  };

  // Action: Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই প্রি-অর্ডারটি মুছে ফেলতে চান?')) return;
    try {
      await DataService.deletePreOrder(id);
      onRefreshPreOrders();
      showToast('🗑️ প্রি-অর্ডারটি সফলভাবে ডিলিট করা হয়েছে।');
    } catch (err) {
      console.error(err);
      alert('ডিলিট করতে সমস্যা হয়েছে।');
    }
  };

  // Action: Save from Modal
  const handleSaveModal = async (saved: PreOrder) => {
    try {
      if (editingPreOrder) {
        await DataService.updatePreOrder(saved.id, saved);
        showToast('✏️ প্রি-অর্ডারের তথ্য আপডেট করা হয়েছে!');
      } else {
        await DataService.savePreOrder(saved);
        showToast('🎉 নতুন প্রি-অর্ডার সফলভাবে সেভ করা হয়েছে!');
      }
      onRefreshPreOrders();
      setEditingPreOrder(null);
    } catch (err) {
      console.error(err);
      alert('সেভ করতে সমস্যা হয়েছে।');
    }
  };

  // Action: Export CSV
  const handleExportCSV = () => {
    const list = activeTab === 'active' ? activeOrders : doneOrders;
    if (list.length === 0) {
      alert('এক্সপোর্ট করার মতো কোনো ডাটা নেই।');
      return;
    }

    const headers = [
      'Order No',
      'Date',
      'Customer Name',
      'Phone',
      'District',
      'Full Address',
      'Products',
      'Total Amount',
      'Advance Paid',
      'Due Amount (COD)',
      'Courier',
      'Status',
    ];

    const rows = list.map((o) => [
      `"${o.orderNumber}"`,
      `"${new Date(o.createdAt).toLocaleDateString('en-GB')}"`,
      `"${o.customerName}"`,
      `"${o.phone}"`,
      `"${o.district}"`,
      `"${o.fullAddress.replace(/"/g, '""')}"`,
      `"${o.items.map((i) => `${i.productName} (${i.productCode}) x${i.quantity}`).join('; ')}"`,
      o.totalAmount,
      o.advancePayment,
      o.dueAmount,
      `"${o.courierName || 'Steadfast'}"`,
      o.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nahar-pre-orders-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 p-3.5 rounded-xl bg-slate-900 border-2 border-emerald-400 text-white shadow-2xl flex items-center gap-2 animate-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(16,185,129,0.4)] shrink-0">
            <FileSpreadsheet className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                প্রি-অর্ডার ম্যানেজমেন্ট শিট (Pre-Orders Sheet)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {activeOrders.length} টি চলমান
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              কাস্টমার মেসেজ থেকে অটো ফিলাপ, পণ্য নির্বাচন, পার্সেল স্লিপ প্রিন্ট ও সম্পন্ন শিট
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="py-2 px-3.5 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/15 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
            title="এক্সেল বা গুগল শিটে ব্যবহারের জন্য CSV ডাউনলোড"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>📊 এক্সেল / CSV ডাউনলোড</span>
          </button>

          <button
            onClick={() => {
              setEditingPreOrder(null);
              setIsModalOpen(true);
            }}
            className="py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer transition-all border border-emerald-300/40"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>➕ নতুন প্রি-অর্ডার যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Quick KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 glass-card rounded-xl border border-white/10">
          <span className="text-[11px] text-slate-400 block font-medium">মোট প্রি-অর্ডার</span>
          <span className="text-lg font-black text-white font-mono mt-0.5 block">
            {stats.total} টি
          </span>
          <span className="text-[10px] text-emerald-400">সর্বমোট ডাটাবেজ</span>
        </div>

        <div className="p-3.5 glass-card rounded-xl border border-amber-500/30 bg-amber-500/5">
          <span className="text-[11px] text-amber-300 block font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>চলমান (Pending)</span>
          </span>
          <span className="text-lg font-black text-amber-300 font-mono mt-0.5 block">
            {stats.activeCount} টি
          </span>
          <span className="text-[10px] text-slate-400">ডেলিভারি অপেক্ষায়</span>
        </div>

        <div className="p-3.5 glass-card rounded-xl border border-emerald-500/30 bg-emerald-500/5">
          <span className="text-[11px] text-emerald-300 block font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>সম্পন্ন (Done Sheet)</span>
          </span>
          <span className="text-lg font-black text-emerald-300 font-mono mt-0.5 block">
            {stats.doneCount} টি
          </span>
          <span className="text-[10px] text-slate-400">সফল ডেলিভারি</span>
        </div>

        <div className="p-3.5 glass-card rounded-xl border border-teal-500/30 bg-teal-500/5">
          <span className="text-[11px] text-teal-300 block font-medium">অগ্রিম প্রাপ্ত (Advance)</span>
          <span className="text-lg font-black text-teal-300 font-mono mt-0.5 block">
            {formatBDT(stats.totalAdvance)}
          </span>
          <span className="text-[10px] text-slate-400">বিকাশ/নগদ সংগৃহীত</span>
        </div>

        <div className="p-3.5 glass-card rounded-xl border border-white/10 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-slate-400 block font-medium">ক্যাশ অন ডেলিভারি বাকি</span>
          <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
            {formatBDT(stats.activeDue)}
          </span>
          <span className="text-[10px] text-slate-400">কুরিয়ার কালেকশন</span>
        </div>
      </div>

      {/* Main Table Container: Dual Sheet Tabs */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden flex flex-col">
        {/* Tab Header Controls */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Tab Switcher: Active Sheet vs Done Sheet */}
          <div className="flex items-center gap-2 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'active'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>📋 চলমান প্রি-অর্ডার শিট</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'active' ? 'bg-slate-950/30 text-slate-950' : 'bg-white/10 text-emerald-300'
                }`}
              >
                {activeOrders.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('done')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'done'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✅ সম্পন্ন প্রি-অর্ডার (Done Sheet)</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'done' ? 'bg-slate-950/30 text-slate-950' : 'bg-white/10 text-slate-300'
                }`}
              >
                {doneOrders.length}
              </span>
            </button>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="নাম, ফোন, কোড, ঠিকানা বা পণ্য দিয়ে খুঁজুন..."
                className="w-full pl-8 pr-3 py-1.5 glass-input rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            {/* District Filter Dropdown */}
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-2.5 py-1.5 glass-input rounded-xl text-xs text-slate-200 bg-slate-900 border border-white/15 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value="ALL">সব জেলা</option>
              <option value="ঢাকা">ঢাকা</option>
              <option value="চট্টগ্রাম">চট্টগ্রাম</option>
              <option value="রাজশাহী">রাজশাহী</option>
              <option value="সিলেট">সিলেট</option>
              <option value="খুলনা">খুলনা</option>
              <option value="গাজীপুর">গাজীপুর</option>
              <option value="সাভার">সাভার</option>
            </select>
          </div>
        </div>

        {/* Spreadsheet View Table */}
        <div className="overflow-x-auto flex-1">
          {displayedOrders.length === 0 ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-slate-400 text-xl">
                📦
              </div>
              <h4 className="font-bold text-white text-sm">
                {activeTab === 'active'
                  ? 'কোনো চলমান প্রি-অর্ডার নেই'
                  : 'কোনো সম্পন্ন প্রি-অর্ডার পাওয়া যায়নি'}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {activeTab === 'active'
                  ? 'ফেসবুক বা হোয়াটসঅ্যাপ থেকে কাস্টমারের নাম, ফোন ও ঠিকানা পেস্ট করে খুব সহজে নতুন প্রি-অর্ডার এন্ট্রি করুন।'
                  : 'চলমান শিট থেকে "Done / সম্পন্ন" বাটনে চাপ দিলে অর্ডারগুলো স্বয়ংক্রিয়ভাবে এই শিটে চলে আসবে।'}
              </p>
              {activeTab === 'active' && (
                <button
                  onClick={() => {
                    setEditingPreOrder(null);
                    setIsModalOpen(true);
                  }}
                  className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md mt-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন প্রি-অর্ডার যোগ করুন</span>
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-3 text-center w-12">নং</th>
                  <th className="py-3 px-3">অর্ডার ও তারিখ</th>
                  <th className="py-3 px-3">👤 কাস্টমারের তথ্য</th>
                  <th className="py-3 px-3">📍 সম্পূর্ণ ঠিকানা</th>
                  <th className="py-3 px-3">📦 পণ্য বিবরণী</th>
                  <th className="py-3 px-3 text-right">মোট টাকা</th>
                  <th className="py-3 px-3 text-right">অগ্রিম (Advance)</th>
                  <th className="py-3 px-3 text-right">বাকি (COD Due)</th>
                  <th className="py-3 px-3 text-center">কুরিয়ার ও স্ট্যাটাস</th>
                  <th className="py-3 px-3 text-center w-40">একশন (Actions)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {displayedOrders.map((order, index) => (
                  <tr
                    key={order.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    {/* Index */}
                    <td className="py-3 px-3 text-center font-mono text-slate-400">
                      {index + 1}
                    </td>

                    {/* Order No & Date */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-white block">
                        {order.orderNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Customer Info with Quick Call & WhatsApp */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-white text-xs">{order.customerName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-mono font-semibold mt-0.5">
                        <span>{order.phone}</span>
                        <a
                          href={`tel:${order.phone}`}
                          className="p-0.5 text-slate-400 hover:text-emerald-400"
                          title="কল করুন"
                        >
                          <Phone className="w-3 h-3" />
                        </a>
                        <a
                          href={`https://wa.me/88${order.phone.replace(/^0/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-0.5 text-slate-400 hover:text-emerald-400"
                          title="হোয়াটসঅ্যাপ মেসেজ দিন"
                        >
                          <MessageCircle className="w-3 h-3" />
                        </a>
                      </div>
                    </td>

                    {/* District & Full Address */}
                    <td className="py-3 px-3 max-w-[200px]">
                      <span className="inline-block px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[10px] mb-0.5 border border-emerald-500/30">
                        {order.district}
                      </span>
                      <p className="text-[11px] text-slate-300 leading-snug line-clamp-2" title={order.fullAddress}>
                        {order.fullAddress}
                      </p>
                    </td>

                    {/* Products details */}
                    <td className="py-3 px-3 min-w-[200px]">
                      <div className="space-y-1">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt=""
                                className="w-7 h-7 rounded object-cover border border-white/10 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-[10px] shrink-0">
                                📦
                              </div>
                            )}
                            <div className="min-w-0 flex-1 leading-tight">
                              <span className="text-[11px] font-semibold text-white truncate block">
                                {item.productName}
                              </span>
                              <span className="text-[9.5px] text-slate-400 font-mono">
                                {item.productCode} · {item.quantity} পিস @{formatBDT(item.unitPrice)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-white text-xs">
                      {formatBDT(order.totalAmount)}
                    </td>

                    {/* Advance Payment */}
                    <td className="py-3 px-3 text-right font-mono">
                      {order.advancePayment > 0 ? (
                        <span className="text-emerald-300 font-bold">
                          {formatBDT(order.advancePayment)}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">৳০</span>
                      )}
                    </td>

                    {/* Due COD Amount */}
                    <td className="py-3 px-3 text-right font-mono">
                      <span
                        className={`font-black text-xs px-2 py-0.5 rounded ${
                          order.dueAmount > 0
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {formatBDT(order.dueAmount)}
                      </span>
                    </td>

                    {/* Courier & Status Badge */}
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[120px] mx-auto">
                        {order.courierName || 'Steadfast'}
                      </span>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                          order.status === 'DONE'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : order.status === 'CONFIRMED'
                            ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {order.status === 'DONE'
                          ? '✅ সম্পন্ন'
                          : order.status === 'CONFIRMED'
                          ? 'কনফার্মড'
                          : 'অপেক্ষমাণ'}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {/* 1. DONE BUTTON (If Active Sheet) */}
                        {activeTab === 'active' ? (
                          <button
                            onClick={() => handleMarkDone(order.id)}
                            className="py-1 px-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-lg text-[11px] flex items-center gap-1 cursor-pointer shadow-sm transition-all"
                            title="অর্ডারটি সফল হয়েছে চিহ্নিত করে সম্পন্ন শিটে পাঠান"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Done</span>
                          </button>
                        ) : (
                          /* Reopen button (If Done Sheet) */
                          <button
                            onClick={() => handleReopen(order.id)}
                            className="py-1 px-2 bg-white/10 hover:bg-white/15 text-slate-300 rounded-lg text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                            title="পুনরায় চলমান শিটে ফেরত পাঠান"
                          >
                            <RotateCcw className="w-3 h-3 text-amber-400" />
                            <span>রি-ওপেন</span>
                          </button>
                        )}

                        {/* 2. PRINT SLIP BUTTON */}
                        <button
                          onClick={() => {
                            setSelectedSlipOrder(order);
                            setIsSlipModalOpen(true);
                          }}
                          className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg cursor-pointer transition-colors"
                          title="কুরিয়ার পার্সেল স্লিপ প্রিন্ট করুন"
                        >
                          <Printer className="w-3.5 h-3.5 text-teal-300" />
                        </button>

                        {/* 3. EDIT BUTTON */}
                        <button
                          onClick={() => {
                            setEditingPreOrder(order);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg cursor-pointer transition-colors"
                          title="এডিট করুন"
                        >
                          <Edit className="w-3.5 h-3.5 text-slate-300" />
                        </button>

                        {/* 4. DELETE BUTTON */}
                        <button
                          onClick={() => handleDelete(order.id)}
                          className="p-1.5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 rounded-lg cursor-pointer transition-colors"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Table Footer with Summary Count */}
        <div className="p-3 border-t border-white/10 bg-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>
            প্রদর্শিত হচ্ছে: <strong>{displayedOrders.length}</strong> টি প্রি-অর্ডার
          </span>
          <div className="flex items-center gap-4 text-[11px]">
            <span>
              মোট প্রদেয়: <strong className="text-white">{formatBDT(displayedOrders.reduce((sum, o) => sum + o.totalAmount, 0))}</strong>
            </span>
            <span>
              মোট বাকি (COD): <strong className="text-emerald-400">{formatBDT(displayedOrders.reduce((sum, o) => sum + o.dueAmount, 0))}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Pre-Order Create / Edit Modal */}
      {isModalOpen && (
        <PreOrderModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingPreOrder(null);
          }}
          onSave={handleSaveModal}
          products={products}
          preOrderToEdit={editingPreOrder}
        />
      )}

      {/* Parcel Slip Modal */}
      {isSlipModalOpen && selectedSlipOrder && (
        <PreOrderSlipModal
          isOpen={isSlipModalOpen}
          onClose={() => {
            setIsSlipModalOpen(false);
            setSelectedSlipOrder(null);
          }}
          preOrder={selectedSlipOrder}
          brandSettings={brandSettings}
          onMarkDone={handleMarkDone}
        />
      )}
    </div>
  );
};
