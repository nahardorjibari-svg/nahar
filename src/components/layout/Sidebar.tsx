import React from 'react';
import {
  LayoutDashboard,
  Shirt,
  Boxes,
  ShoppingBag,
  ShoppingCart,
  Video,
  FileText,
  Truck,
  RotateCcw,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  DollarSign,
  Sparkles,
} from 'lucide-react';
import { PageId, BrandSettings, UserSession, GlassTheme } from '../../types';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  brandSettings: BrandSettings;
  user: UserSession;
  onLogout: () => void;
  lowStockCount: number;
  glassTheme?: GlassTheme;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onNavigate,
  brandSettings,
  user,
  onLogout,
  lowStockCount,
}) => {
  const navItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-sale' as PageId, label: 'New Sale / Order', icon: ShoppingCart },
    { id: 'products' as PageId, label: 'Products', icon: Shirt, badge: null },
    {
      id: 'stock' as PageId,
      label: 'Stock Management',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount}` : null,
      badgeColor: 'bg-amber-500/30 text-amber-300 border border-amber-400/30',
    },
    { id: 'sales' as PageId, label: 'Sales History', icon: ShoppingBag },
    { id: 'videos' as PageId, label: 'Video / Post Ads', icon: Video },
    { id: 'invoices' as PageId, label: 'Invoices & Memo', icon: FileText },
    { id: 'courier' as PageId, label: 'Courier Orders', icon: Truck },
    { id: 'settlements' as PageId, label: 'COD Accounts & Settlements', icon: DollarSign },
    { id: 'returns' as PageId, label: 'Returns & Exchange', icon: RotateCcw },
    { id: 'customers' as PageId, label: 'Customers', icon: Users },
    { id: 'reports' as PageId, label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings' as PageId, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 glass-panel flex flex-col shrink-0 select-none border-r border-white/10 relative z-20 backdrop-blur-2xl">
      {/* Brand Header */}
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-white/10 shadow-[0_0_15px_rgba(16,185,129,0.25)] flex items-center justify-center shrink-0 border border-white/20 p-0.5">
          {brandSettings.logoUrl ? (
            <img
              src={brandSettings.logoUrl}
              alt={brandSettings.brandName}
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="font-bold text-emerald-400 text-lg">ND</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-white text-sm tracking-tight truncate leading-tight">
            {brandSettings.brandName}
          </h1>
          <p className="text-[10px] text-emerald-400/90 truncate font-semibold flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Nahar Dorjibari
          </p>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 px-3 py-3.5 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer text-left relative ${
                isActive
                  ? 'bg-white/15 text-white border border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              )}
              <div className="flex items-center gap-2.5 min-w-0 pl-1">
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-white/10 text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Footer */}
      <div className="p-3 border-t border-white/10 bg-black/30">
        <div className="flex items-center justify-between p-2.5 rounded-xl glass-card border border-white/10">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-white truncate">{user.name}</p>
            <p className="text-[10px] text-emerald-400/90 font-medium truncate flex items-center gap-1">
              <span>●</span> {user.role}
            </p>
          </div>
          <button
            onClick={onLogout}
            title="Sign Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-white/10"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
