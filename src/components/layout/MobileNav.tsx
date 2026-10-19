import React from 'react';
import {
  LayoutDashboard,
  Shirt,
  Boxes,
  ShoppingBag,
  ShoppingCart,
  Video,
  MoreHorizontal,
  X,
  FileText,
  Truck,
  RotateCcw,
  Users,
  BarChart3,
  Settings,
  LogOut,
  MapPin,
  Receipt,
} from 'lucide-react';
import { PageId, BrandSettings, UserSession } from '../../types';

interface MobileNavProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  brandSettings: BrandSettings;
  user: UserSession;
  onLogout: () => void;
  isDrawerOpen: boolean;
  onCloseDrawer: () => void;
  lowStockCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentPage,
  onNavigate,
  brandSettings,
  user,
  onLogout,
  isDrawerOpen,
  onCloseDrawer,
  lowStockCount,
}) => {
  const primaryTabs = [
    { id: 'dashboard' as PageId, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-sale' as PageId, label: 'New Sale', icon: ShoppingCart },
    { id: 'products' as PageId, label: 'Products', icon: Shirt },
    {
      id: 'stock' as PageId,
      label: 'Stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? lowStockCount : null,
    },
  ];

  const fullNavItems = [
    { id: 'dashboard' as PageId, label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'new-sale' as PageId, label: 'New Sale / Order', icon: ShoppingCart },
    { id: 'expenses' as PageId, label: 'খরচ (Daily Expenses)', icon: Receipt },
    { id: 'products' as PageId, label: '3-Piece Products', icon: Shirt },
    {
      id: 'stock' as PageId,
      label: 'Stock & Audit Movements',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Alert` : null,
    },
    { id: 'sales' as PageId, label: 'Sales History', icon: ShoppingBag },
    { id: 'videos' as PageId, label: 'Video & Post Tracking', icon: Video },
    { id: 'invoices' as PageId, label: 'Invoices & Billing', icon: FileText },
    { id: 'courier' as PageId, label: 'Steadfast Courier', icon: Truck },
    { id: 'returns' as PageId, label: 'Returns & Exchange', icon: RotateCcw },
    { id: 'customers' as PageId, label: 'Customer Directory', icon: Users },
    { id: 'reports' as PageId, label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'settings' as PageId, label: 'Settings & Cloud Config', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Bottom Bar (Sticky footer on screens < lg) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel-elevated border-t border-white/10 px-2 py-1.5 flex items-center justify-around shadow-2xl backdrop-blur-2xl">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-h-[44px] min-w-[56px] transition-all relative cursor-pointer ${
                isActive ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={() => onNavigate('settings')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl min-h-[44px] min-w-[56px] transition-all cursor-pointer ${
            !['dashboard', 'products', 'stock', 'sales'].includes(currentPage)
              ? 'text-emerald-400 font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 whitespace-nowrap">Menu</span>
        </button>
      </div>

      {/* Slide-over Drawer for all pages */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseDrawer}
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-slate-900 text-slate-200 h-full flex flex-col shadow-2xl z-10 border-r border-slate-800">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-white flex items-center justify-center border-2 border-amber-400 p-0.5 shrink-0 shadow-sm">
                  {brandSettings.logoUrl ? (
                    <img
                      src={brandSettings.logoUrl}
                      alt={brandSettings.brandName}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-bold text-amber-500">ন</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm truncate">
                    {brandSettings.brandName}
                  </h3>
                  <p className="text-[10px] text-amber-400/90 font-medium">Nahar Dorjibari · ৩-পিস বুটিক</p>
                </div>
              </div>
              <button
                onClick={onCloseDrawer}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">{brandSettings.branch}</span>
            </div>

            {/* List */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
              {fullNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onCloseDrawer();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-200 text-amber-900">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-white">{user.name}</p>
                <p className="text-[10px] text-amber-400">{user.role}</p>
              </div>
              <button
                onClick={() => {
                  onCloseDrawer();
                  onLogout();
                }}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
