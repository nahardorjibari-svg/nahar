import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Plus, Sparkles, Waves, Check, ChevronDown, Phone, MessageCircle, QrCode, Database, Cloud } from 'lucide-react';
import { PageId, BrandSettings, GlassTheme, GlassFrostMode } from '../../types';

interface TopHeaderProps {
  currentPage: PageId;
  brandSettings: BrandSettings;
  onOpenMobileMenu: () => void;
  onQuickSearchCode: (code: string) => void;
  onOpenAddProduct: () => void;
  onOpenAddStock: () => void;
  onOpenNewSale?: () => void;
  onOpenFirebaseModal: () => void;
  onOpenQrScanner?: () => void;
  glassTheme?: GlassTheme;
  onThemeChange?: (theme: GlassTheme) => void;
  enableAuraMotion?: boolean;
  onToggleAuraMotion?: () => void;
  glassFrostMode?: GlassFrostMode;
  onFrostModeChange?: (mode: GlassFrostMode) => void;
}

const THEME_OPTIONS: Array<{
  id: GlassTheme;
  label: string;
  dotColor: string;
  glowColor: string;
  accent: string;
}> = [
  {
    id: 'emerald',
    label: 'Emerald Luxury',
    dotColor: 'bg-emerald-400',
    glowColor: 'shadow-[0_0_12px_rgba(16,185,129,0.8)]',
    accent: 'Emerald & Gold Luxury Glass',
  },
  {
    id: 'sapphire',
    label: 'Midnight Sapphire',
    dotColor: 'bg-sky-400',
    glowColor: 'shadow-[0_0_12px_rgba(56,189,248,0.8)]',
    accent: 'Electric Sapphire & Indigo Aura',
  },
  {
    id: 'cyber-ice',
    label: 'Cyber Ice & Diamond',
    dotColor: 'bg-cyan-300',
    glowColor: 'shadow-[0_0_12px_rgba(6,182,212,0.8)]',
    accent: 'Crystal Frosted Specular Glass',
  },
  {
    id: 'amethyst',
    label: 'Royal Amethyst',
    dotColor: 'bg-purple-400',
    glowColor: 'shadow-[0_0_12px_rgba(192,132,252,0.8)]',
    accent: 'Velvet Violet & Fuchsia Glass',
  },
  {
    id: 'ruby-rose',
    label: 'Ruby Rose Quartz',
    dotColor: 'bg-rose-400',
    glowColor: 'shadow-[0_0_12px_rgba(251,113,133,0.8)]',
    accent: 'Crimson Glow & Rose Quartz Aura',
  },
  {
    id: 'amber',
    label: 'Imperial Gold',
    dotColor: 'bg-amber-400',
    glowColor: 'shadow-[0_0_12px_rgba(251,191,36,0.8)]',
    accent: 'Royal Amber & Sunset Aura',
  },
];

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentPage,
  brandSettings,
  onOpenMobileMenu,
  onQuickSearchCode,
  onOpenAddProduct,
  onOpenNewSale,
  onOpenFirebaseModal,
  onOpenQrScanner,
  glassTheme = 'emerald',
  onThemeChange,
  enableAuraMotion = true,
  onToggleAuraMotion,
  glassFrostMode = 'frosted',
  onFrostModeChange,
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (page: PageId) => {
    switch (page) {
      case 'dashboard': return 'Overview & Real-Time Stock';
      case 'new-sale': return 'New Sale & Order Terminal';
      case 'products': return '3-Piece Product Catalog';
      case 'stock': return 'Stock Management & Audit Ledger';
      case 'sales': return 'Sales History & Daily Ledger';
      case 'videos': return 'Video & Social Campaign Performance';
      case 'invoices': return 'Invoices & Customer Billing';
      case 'courier': return 'Steadfast Courier Dispatches';
      case 'settlements': return 'Courier COD Accounts & Settlements';
      case 'returns': return 'Returns & Exchange Tracking';
      case 'customers': return 'Customer Directory';
      case 'reports': return 'Reports & Profit Analytics';
      case 'settings': return 'Brand & Cloud Configuration';
      default: return 'Management Console';
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onQuickSearchCode(searchInput.trim());
    }
  };

  const activeThemeMeta = THEME_OPTIONS.find((t) => t.id === glassTheme) || THEME_OPTIONS[0];

  return (
    <header className="h-16 glass-panel flex items-center justify-between gap-3 px-4 sm:px-6 shrink-0 border-b border-white/10 relative z-30">
      {/* Left: Mobile hamburger, Logo & breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer shrink-0 border border-white/10"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Circular Brand Logo Badge in Header */}
        <div className="w-9 h-9 rounded-full overflow-hidden bg-white/5 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1)] shrink-0 flex items-center justify-center p-0.5">
          {brandSettings.logoUrl ? (
            <img
              src={brandSettings.logoUrl}
              alt={brandSettings.brandName}
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="font-bold text-emerald-400 text-xs">ন</span>
          )}
        </div>

        <div className="min-w-0 hidden sm:block">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
            <span className="truncate text-slate-300 font-semibold">{brandSettings.brandName}</span>
            <span className="text-white/20">/</span>
            <span className="capitalize text-emerald-400 font-semibold">{currentPage}</span>
          </div>
          <h2 className="text-sm font-bold text-white tracking-wide truncate">
            {getPageTitle(currentPage)}
          </h2>
        </div>
      </div>

      {/* Right: Quick actions & Dynamic Glass Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* WhatsApp & Call Helpline Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-card border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
          <a
            href="https://wa.me/8801354234702"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 hover:text-white transition-colors"
            title="Chat on WhatsApp (+880 1354-234702)"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono-numbers">+880 1354-234702</span>
          </a>
          <span className="text-white/20">|</span>
          <a
            href="tel:+8801354234702"
            className="hover:text-white transition-colors"
            title="Call Support (+880 1354-234702)"
          >
            <Phone className="w-3.5 h-3.5 text-amber-400" />
          </a>
        </div>

        {/* Dynamic Glass Theme Switcher */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold glass-card border border-white/20 hover:border-white/40 text-white cursor-pointer transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.3)]"
            title="Change Dynamic Glassmorphism Theme & Frost"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span className="hidden sm:inline text-slate-300 text-[11px]">Dynamic Glass:</span>
            <span className="flex items-center gap-1.5 font-bold">
              <span className={`w-2.5 h-2.5 rounded-full ${activeThemeMeta.dotColor} ${activeThemeMeta.glowColor} ring-1 ring-white/50`} />
              <span className="text-xs">{activeThemeMeta.label.split(' ')[0]}</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Theme Dropdown Menu */}
          {isThemeMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 glass-panel-elevated rounded-2xl p-3 space-y-2 shadow-[0_24px_60px_rgba(0,0,0,0.85)] border border-white/25 animate-in fade-in zoom-in-95 duration-150 z-50">
              <div className="px-2 py-1 flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Dynamic Glass Studio
                </span>
                {onToggleAuraMotion && (
                  <button
                    onClick={onToggleAuraMotion}
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-colors cursor-pointer border ${
                      enableAuraMotion
                        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                        : 'bg-white/5 text-slate-400 border-white/10'
                    }`}
                    title="Toggle animated background aura waves"
                  >
                    <Waves className="w-3 h-3" />
                    <span>{enableAuraMotion ? 'Aura Active' : 'Aura Paused'}</span>
                  </button>
                )}
              </div>

              {/* Frost Intensity Selector */}
              {onFrostModeChange && (
                <div className="px-2 py-1.5 bg-black/30 rounded-xl border border-white/10">
                  <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5">
                    Glass Frost Intensity (কাচের স্বচ্ছতা)
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {[
                      { id: 'crisp', label: 'Crisp Glass' },
                      { id: 'frosted', label: 'Frosted' },
                      { id: 'deep', label: 'Deep Blur' },
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => onFrostModeChange(mode.id as GlassFrostMode)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold text-center transition-all cursor-pointer ${
                          glassFrostMode === mode.id
                            ? 'bg-white/20 text-white border border-white/30 shadow-xs'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Theme Palettes List */}
              <div className="space-y-1 pt-1 max-h-64 overflow-y-auto pr-1">
                {THEME_OPTIONS.map((theme) => {
                  const isSelected = glassTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        if (onThemeChange) onThemeChange(theme.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white/15 border border-white/30 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.25)]'
                          : 'hover:bg-white/5 text-slate-300 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${theme.dotColor} ${theme.glowColor} ring-1 ring-white/40`} />
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{theme.label}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 leading-tight">{theme.accent}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Quick Search */}
        <form onSubmit={handleSearchSubmit} className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search code..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-3 py-1.5 glass-input rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-400 uppercase font-mono-numbers w-36 lg:w-48 transition-all"
          />
        </form>

        {/* QR Scanner Trigger Button */}
        {onOpenQrScanner && (
          <button
            onClick={onOpenQrScanner}
            className="p-2 glass-card hover:bg-white/15 border border-white/20 text-emerald-300 hover:text-white rounded-xl transition-all cursor-pointer shadow-sm"
            title="📷 পোশাকের QR কোড / বারকোড স্ক্যান করুন (Scan QR / Barcode)"
          >
            <QrCode className="w-4 h-4" />
          </button>
        )}

        {/* Cloud Firebase Data Viewer Button */}
        <button
          onClick={onOpenFirebaseModal}
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 glass-card hover:bg-white/15 border border-white/20 text-slate-300 hover:text-emerald-300 rounded-xl transition-all cursor-pointer text-xs font-semibold"
          title="☁️ Firebase ক্লাউড ডাটাবেজ ইন্সপেক্টর (View Cloud Collections)"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden xl:inline">Firebase ডাটা</span>
        </button>

        {onOpenNewSale && (
          <button
            onClick={onOpenNewSale}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.35)] border border-emerald-300/40"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Sale</span>
          </button>
        )}
        
        <button
          onClick={onOpenAddProduct}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white glass-card hover:border-white/30 rounded-xl transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Product</span>
        </button>
      </div>
    </header>
  );
};
