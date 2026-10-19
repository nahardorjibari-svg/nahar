import React, { useState, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  Layers,
  Search,
  Filter,
  TrendingDown,
  Sparkles,
  Info,
  CheckCircle2,
  ArrowRight,
  Boxes,
  PieChart,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { DailyExpense, Product, UserSession } from '../../types';
import { formatBDT, formatBDDate, DataService } from '../../services/dataService';

interface DailyExpensesViewProps {
  expenses: DailyExpense[];
  products: Product[];
  user: UserSession;
  onExpenseAdded: (expense: DailyExpense) => void;
  onExpenseDeleted: (id: string) => void;
  onNavigateToNewSale: () => void;
}

const EXPENSE_CATEGORIES = [
  'প্যাকেজিং (Packaging)',
  'বিজ্ঞাপন ও বুস্টিং (Ads & Marketing)',
  'অফিস ও নাস্তা (Office & Snacks)',
  'দোকান ভাড়া ও বিল (Rent & Utilities)',
  'পরিবহন ও ডেলিভারি (Transport)',
  'অন্যান্য বিবিধ (Other Expenses)',
];

const PRESET_EXPENSE_SUGGESTIONS = [
  'প্যাকেজিং পলি ব্যাগ ও সিকিউরিটি টেপ',
  'ফেসবুক লাইভ বুস্টিং ও রিল প্রমোশন',
  'দোকানের কার্টুন ও ড্রেস কাভার',
  'অফিস চা-নাস্তা ও ডেলিভারি পার্টনার খরচ',
  'দোকান ভাড়া ও বিদ্যুৎ বিল',
  'কুরিয়ার প্যাকিং বাবল র‍্যাপ',
];

export const DailyExpensesView: React.FC<DailyExpensesViewProps> = ({
  expenses,
  products,
  user,
  onExpenseAdded,
  onExpenseDeleted,
  onNavigateToNewSale,
}) => {
  const isSuperAdmin = user.role === 'Super Admin';

  // Form State
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [periodFilter, setPeriodFilter] = useState<'ALL' | 'TODAY' | 'THIS_MONTH'>('ALL');

  // Total Stock calculation
  const totalStockPieces = useMemo(() => {
    return products.reduce((acc, p) => acc + Math.max(0, Number(p.currentStock) || 0), 0);
  }, [products]);

  // Overall calculations
  const totalAllExpenses = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  const todayExpensesTotal = useMemo(() => {
    return expenses
      .filter(e => (e.date || '').startsWith(todayStr))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, todayStr]);

  const monthExpensesTotal = useMemo(() => {
    return expenses
      .filter(e => (e.date || '').startsWith(currentMonthStr))
      .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses, currentMonthStr]);

  // Auto per-piece cost allocation: Total Expenses / Total Stock
  const perPieceExpense = useMemo(() => {
    if (totalStockPieces <= 0) return 0;
    return totalAllExpenses / totalStockPieces;
  }, [totalAllExpenses, totalStockPieces]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      // Period filter
      if (periodFilter === 'TODAY' && !(e.date || '').startsWith(todayStr)) {
        return false;
      }
      if (periodFilter === 'THIS_MONTH' && !(e.date || '').startsWith(currentMonthStr)) {
        return false;
      }

      // Category filter
      if (selectedCategoryFilter !== 'ALL' && e.category !== selectedCategoryFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = (e.title || '').toLowerCase().includes(query);
        const matchesCategory = (e.category || '').toLowerCase().includes(query);
        const matchesNotes = (e.notes || '').toLowerCase().includes(query);
        if (!matchesTitle && !matchesCategory && !matchesNotes) return false;
      }

      return true;
    });
  }, [expenses, periodFilter, selectedCategoryFilter, searchQuery, todayStr, currentMonthStr]);

  // Handle Add Expense
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      alert('⚠️ শুধুমাত্র Super Admin খরচ এন্ট্রি দিতে পারবেন। Admin ও User শুধুই দেখতে পারবেন।');
      return;
    }

    if (!title.trim()) {
      alert('অনুগ্রহ করে খরচের বিবরণ/নাম লিখুন।');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন।');
      return;
    }

    try {
      setIsSubmitting(true);
      const newExp = await DataService.saveDailyExpense({
        title: title.trim(),
        amount: numAmount,
        category,
        date: date || todayStr,
        notes: notes.trim(),
        recordedBy: user.name || user.role,
      });

      onExpenseAdded(newExp);
      setTitle('');
      setAmount('');
      setNotes('');
      setSuccessNotice(`✅ ৳${numAmount.toLocaleString()} এর খরচ সফলভাবে সংরক্ষিত ও স্টক অনুপাতে হিসাব করা হয়েছে!`);
      setTimeout(() => setSuccessNotice(null), 4000);
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('খরচ সংরক্ষণে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, expTitle: string, expAmount: number) => {
    if (!isSuperAdmin) {
      alert('⚠️ খরচ মুছে ফেলার অধিকার শুধুমাত্র Super Admin এর রয়েছে।');
      return;
    }

    if (window.confirm(`আপনি কি "${expTitle}" (৳${expAmount}) খরচটি মুছে ফেলতে চান?`)) {
      await DataService.deleteDailyExpense(id);
      onExpenseDeleted(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <span>দৈনিক খরচ ম্যানেজমেন্ট (Daily Expenses)</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                দৈনিক যাবতীয় খরচ এন্ট্রি করুন — মোট খরচ আপনার বিদ্যমান স্টক অনুযায়ী স্বয়ংক্রিয়ভাবে প্রতি পিসে বিভক্ত হবে।
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onNavigateToNewSale}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer self-start sm:self-auto border border-emerald-300/40"
        >
          <ShoppingBag className="w-4 h-4 text-slate-950" />
          <span>নতুন সেলে প্রতি পিস খরচ দেখুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Formula & Allocation Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel-elevated border border-amber-500/30 p-5 bg-gradient-to-br from-amber-950/30 via-slate-900/60 to-emerald-950/20 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>স্বয়ংক্রিয় প্রতি পিস খরচ হিসাব (Auto Expense Allocation Formula)</span>
            </span>
            <span className="text-[11px] text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              রিয়েল-টাইম স্টক লিঙ্কড
            </span>
          </div>

          {/* Visual Equation Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center">
            {/* Step 1: Total Expenses */}
            <div className="glass-card p-4 rounded-xl border border-white/10 bg-black/40">
              <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                সর্বমোট এন্ট্রি করা খরচ
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono-numbers">
                {formatBDT(totalAllExpenses)}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                মোট {expenses.length} টি খরচ রেকর্ড
              </span>
            </div>

            {/* Operator: Divide */}
            <div className="hidden md:flex justify-center items-center">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white text-lg border border-white/20">
                ÷
              </div>
            </div>

            {/* Step 2: Total Stock Pieces */}
            <div className="glass-card p-4 rounded-xl border border-white/10 bg-black/40">
              <span className="text-[11px] text-slate-400 block mb-1 flex items-center gap-1">
                <Boxes className="w-3.5 h-3.5 text-sky-400" />
                বর্তমান মোট প্রোডাক্ট স্টক
              </span>
              <div className="text-xl sm:text-2xl font-black text-sky-300 font-mono-numbers">
                {totalStockPieces.toLocaleString()} <span className="text-sm font-normal text-slate-400">পিস</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                {products.length} টি 3-পিস প্রোডাক্টের সমষ্টি
              </span>
            </div>

            {/* Result: Per Piece Expense */}
            <div className="glass-card p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/30 md:col-span-1 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <span className="text-[11px] text-emerald-300 block mb-1 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                প্রতি পিসে অটো বরাদ্দ খরচ
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono-numbers">
                ৳{perPieceExpense.toFixed(2)}
                <span className="text-xs font-normal text-slate-400 ml-1">/ পিস</span>
              </div>
              <span className="text-[10px] text-emerald-400/90 mt-1 block font-medium">
                নতুন সেল করার সময় এই রেটে প্রফিট হিসাব হবে
              </span>
            </div>
          </div>

          {/* Quick period breakdown cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center">
              <span className="text-slate-400 text-[11px]">আজকের খরচ:</span>
              <strong className="text-white font-mono-numbers">{formatBDT(todayExpensesTotal)}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center">
              <span className="text-slate-400 text-[11px]">চলতি মাসের খরচ:</span>
              <strong className="text-white font-mono-numbers">{formatBDT(monthExpensesTotal)}</strong>
            </div>
            <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-white/5 border border-white/10 flex justify-between items-center">
              <span className="text-slate-400 text-[11px]">গড় প্রতি পিস খরচ:</span>
              <strong className="text-amber-300 font-mono-numbers">৳{perPieceExpense.toFixed(1)}/pc</strong>
            </div>
          </div>
        </div>
      </div>

      {successNotice && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Main Grid: Add Expense Form (Left) & Expense History (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Add Daily Expense (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel-elevated p-5 rounded-2xl border border-white/15 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>নতুন খরচ এন্ট্রি করুন</span>
              </h2>
              {!isSuperAdmin && (
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  ভিউ-অনলি মোড
                </span>
              )}
            </div>

            {!isSuperAdmin && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  আপনার বর্তমান ভূমিকা <strong>{user.role}</strong>। শুধুমাত্র Super Admin (পাসওয়ার্ড: 7862) খরচ এন্ট্রি দিতে পারেন।
                </span>
              </div>
            )}

            <form onSubmit={handleSubmitExpense} className="space-y-3.5 text-xs">
              {/* Quick suggestion pills */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                  দ্রুত খরচের নাম সিলেক্ট করুন (বা নিজে লিখুন):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_EXPENSE_SUGGESTIONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!isSuperAdmin}
                      onClick={() => setTitle(preset)}
                      className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        title === preset
                          ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title / Description */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  খরচের বিবরণ / নাম <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="যেমন: প্যাকেজিং পলি ব্যাগ, ফেসবুক বুস্টিং, চা-নাস্তা"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  disabled={!isSuperAdmin || isSubmitting}
                  required
                  className="w-full px-3 py-2 glass-input rounded-xl text-white placeholder-slate-500 focus:ring-1 focus:ring-amber-400 text-xs"
                />
              </div>

              {/* Amount & Date in 2 Cols */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    খরচের পরিমাণ (৳) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 500"
                      value={amount}
                      onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                      disabled={!isSuperAdmin || isSubmitting}
                      required
                      className="w-full pl-7 pr-3 py-2 glass-input rounded-xl text-white font-mono-numbers font-bold focus:ring-1 focus:ring-amber-400 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    তারিখ (Date)
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    disabled={!isSuperAdmin || isSubmitting}
                    className="w-full px-3 py-2 glass-input rounded-xl text-white text-xs focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  ক্যাটাগরি (Category)
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  disabled={!isSuperAdmin || isSubmitting}
                  className="w-full px-3 py-2 glass-input rounded-xl text-white text-xs focus:ring-1 focus:ring-amber-400"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  অতিরিক্ত নোট (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  placeholder="যেমন: কার্টুন বক্সের সাইজ, ট্রানজেকশন রেফারেন্স ইত্যাদি"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  disabled={!isSuperAdmin || isSubmitting}
                  className="w-full px-3 py-2 glass-input rounded-xl text-white placeholder-slate-500 text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={!isSuperAdmin || isSubmitting}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] disabled:opacity-50 border border-amber-300/40"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                <span>{isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'খরচ যুক্ত করুন ও সেভ রাখুন'}</span>
              </button>
            </form>
          </div>

          {/* Explanation info note */}
          <div className="glass-card p-4 rounded-xl border border-white/10 text-xs text-slate-400 space-y-1.5">
            <h4 className="font-semibold text-slate-200 flex items-center gap-1.5 text-xs">
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span>কীভাবে এটি কাজ করে?</span>
            </h4>
            <p className="text-[11px] leading-relaxed">
              আপনি প্রতিদিন বা যখনই যা খরচ করবেন (প্যাকেজিং, অ্যাডস, চা-নাস্তা ইত্যাদি), তা এখানে নাম ও টাকা দিয়ে যুক্ত করবেন। সিস্টেম স্বয়ংক্রিয়ভাবে সর্বমোট খরচকে আপনার মোট প্রোডাক্ট স্টক দিয়ে ভাগ করে প্রতি পিসের খরচ বের করবে। সেল করার সময় সেই প্রতি পিস খরচ পণ্যের নিচে শো করবে।
            </p>
          </div>
        </div>

        {/* Right Column: Expenses History & Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-panel rounded-2xl border border-white/15 shadow-xl overflow-hidden">
            {/* Filter bar */}
            <div className="p-4 border-b border-white/10 bg-white/5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-amber-400" />
                  <span>খরচের তালিকা ও হিস্টোরি ({filteredExpenses.length})</span>
                </h3>

                {/* Period tabs */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-[11px]">
                  <button
                    onClick={() => setPeriodFilter('ALL')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      periodFilter === 'ALL'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    সব খরচ
                  </button>
                  <button
                    onClick={() => setPeriodFilter('TODAY')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      periodFilter === 'TODAY'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    আজকের
                  </button>
                  <button
                    onClick={() => setPeriodFilter('THIS_MONTH')}
                    className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      periodFilter === 'THIS_MONTH'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    চলতি মাস
                  </button>
                </div>
              </div>

              {/* Search & Category filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="খরচের নাম দিয়ে খুঁজুন..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 glass-input rounded-xl text-white text-xs placeholder-slate-500"
                  />
                </div>

                <select
                  value={selectedCategoryFilter}
                  onChange={e => setSelectedCategoryFilter(e.target.value)}
                  className="w-full px-3 py-1.5 glass-input rounded-xl text-white text-xs"
                >
                  <option value="ALL" className="bg-slate-900 text-white">সকল ক্যাটাগরি</option>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List / Table */}
            {filteredExpenses.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Receipt className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">কোনো খরচের রেকর্ড পাওয়া যায়নি।</p>
                <p className="text-[11px] text-slate-500">বামপাশের ফর্ম থেকে নতুন খরচ এন্ট্রি দিন।</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10 max-h-[550px] overflow-y-auto">
                {filteredExpenses.map(item => {
                  return (
                    <div
                      key={item.id}
                      className="p-3.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate text-xs">
                            {item.title}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/10 shrink-0">
                            {item.category.split(' ')[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {item.date || 'আজ'}
                          </span>
                          <span>• দ্বারা: {item.recordedBy || 'Admin'}</span>
                          {item.notes && <span className="truncate italic">({item.notes})</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span className="font-mono-numbers font-black text-amber-400 text-sm block">
                            {formatBDT(item.amount)}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ≈ ৳{(totalStockPieces > 0 ? item.amount / totalStockPieces : 0).toFixed(2)}/পিস
                          </span>
                        </div>

                        {isSuperAdmin && (
                          <button
                            onClick={() => handleDelete(item.id, item.title, item.amount)}
                            title="মুছে ফেলুন"
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Table Footer */}
            <div className="p-3 bg-black/40 border-t border-white/10 flex justify-between items-center text-xs">
              <span className="text-slate-400">
                ফিল্টারকৃত মোট খরচ:
              </span>
              <span className="font-mono-numbers font-bold text-amber-300">
                {formatBDT(filteredExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
