/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  PageId,
  Product,
  StockMovement,
  BrandSettings,
  UserSession,
  SaleOrder,
  VideoPost,
  Customer,
  ReturnRecord,
  SettlementRecord,
  OrderStatus,
  PaymentStatus,
  ReturnReason,
  GlassTheme,
  GlassFrostMode,
} from './types';
import { DataService } from './services/dataService';
import { INITIAL_BRAND_SETTINGS } from './services/seedData';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { MobileNav } from './components/layout/MobileNav';
import { DataBanner } from './components/common/DataBanner';
import { FirebaseSetupModal } from './components/common/FirebaseSetupModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { ProductsView } from './components/products/ProductsView';
import { ProductModal } from './components/products/ProductModal';
import { ProductDetailDrawer } from './components/products/ProductDetailDrawer';
import { StockManagementView } from './components/stock/StockManagementView';
import { NewSaleView } from './components/sales/NewSaleView';
import { SalesHistoryView } from './components/sales/SalesHistoryView';
import { VideoTrackingView } from './components/videos/VideoTrackingView';
import { InvoicesView } from './components/invoices/InvoicesView';
import { InvoicePrintModal } from './components/invoices/InvoicePrintModal';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CourierOrdersView } from './components/courier/CourierOrdersView';
import { SettlementsView } from './components/settlements/SettlementsView';
import { ReturnsView } from './components/returns/ReturnsView';
import { CustomersView } from './components/customers/CustomersView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { AdminLoginView } from './components/auth/AdminLoginView';

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(INITIAL_BRAND_SETTINGS);
  const [orders, setOrders] = useState<SaleOrder[]>([]);
  const [videos, setVideos] = useState<VideoPost[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [settlements, setSettlements] = useState<SettlementRecord[]>([]);

  const [user, setUser] = useState<UserSession>({
    id: 'usr-admin-01',
    name: 'Super Admin',
    email: 'nahardorjibari@gmail.com',
    role: 'Super Admin',
    branch: 'Dhaka Flagship Showroom',
    isAuthenticated: true,
  });

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isFirebaseModalOpen, setIsFirebaseModalOpen] = useState(false);

  // Product modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  // Product detail drawer
  const [productForDetailDrawer, setProductForDetailDrawer] = useState<Product | null>(null);

  // Invoice Print / View Modal
  const [orderForInvoiceModal, setOrderForInvoiceModal] = useState<SaleOrder | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Cross-screen navigation params
  const [productsSearchQuery, setProductsSearchQuery] = useState('');
  const [stockSelectedProductId, setStockSelectedProductId] = useState<string | undefined>(undefined);
  const [sellProductCode, setSellProductCode] = useState<string | undefined>(undefined);

  // Dynamic Glass Theme & Frost State
  const [glassTheme, setGlassTheme] = useState<GlassTheme>(() => {
    return (localStorage.getItem('nahar_glass_theme') as GlassTheme) || 'emerald';
  });
  const [glassFrostMode, setGlassFrostMode] = useState<GlassFrostMode>(() => {
    return (localStorage.getItem('nahar_glass_frost') as GlassFrostMode) || 'frosted';
  });
  const [enableAuraMotion, setEnableAuraMotion] = useState<boolean>(() => {
    return localStorage.getItem('nahar_glass_motion') !== 'false';
  });

  const handleThemeChange = (newTheme: GlassTheme) => {
    setGlassTheme(newTheme);
    localStorage.setItem('nahar_glass_theme', newTheme);
  };

  const handleFrostModeChange = (mode: GlassFrostMode) => {
    setGlassFrostMode(mode);
    localStorage.setItem('nahar_glass_frost', mode);
  };

  const handleToggleAuraMotion = () => {
    setEnableAuraMotion((prev) => {
      const next = !prev;
      localStorage.setItem('nahar_glass_motion', String(next));
      return next;
    });
  };

  // Load all application data
  const loadData = useCallback(async () => {
    try {
      const [prods, movs, brand, ords, vids, custs, rets, sets] = await Promise.all([
        DataService.getProducts(),
        DataService.getStockMovements(),
        DataService.getBrandSettings(),
        DataService.getOrders(),
        DataService.getVideos(),
        DataService.getCustomers(),
        DataService.getReturns(),
        DataService.getSettlements(),
      ]);
      setProducts(prods);
      setMovements(movs);
      setBrandSettings(brand);
      setOrders(ords);
      setVideos(vids);
      setCustomers(custs);
      setReturns(rets);
      setSettlements(sets);
    } catch (e) {
      console.error('Failed to load application data:', e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check for URL QR verification on mount (e.g. ?verify_invoice=ND-INV-2026-1042&token=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const verifyInv = params.get('verify_invoice');
      const token = params.get('token');
      if (verifyInv && orders.length > 0) {
        const found = orders.find(
          (o) =>
            o.invoiceNumber.toLowerCase() === verifyInv.toLowerCase() ||
            (token && o.verificationToken === token)
        );
        if (found) {
          setOrderForInvoiceModal(found);
          setIsInvoiceModalOpen(true);
        }
      }
    } catch (err) {
      console.warn('URL param check failed', err);
    }
  }, [orders]);

  // Compute low stock items
  const lowStockCount = products.filter(
    (p) => p.currentStock <= p.lowStockThreshold && p.currentStock > 0
  ).length;

  // Actions
  const handleOpenAddProduct = () => {
    setProductToEdit(null);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (prod: Product) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
    setProductForDetailDrawer(null);
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (window.confirm(`Are you sure you want to delete ${prod.productCode} (${prod.name})?`)) {
      await DataService.deleteProduct(prod.id);
      loadData();
      if (productForDetailDrawer?.id === prod.id) {
        setProductForDetailDrawer(null);
      }
    }
  };

  const handleAddStockForProduct = (prod: Product) => {
    setStockSelectedProductId(prod.id);
    setCurrentPage('stock');
    setProductForDetailDrawer(null);
  };

  const handleQuickSearchCode = (code: string) => {
    const found = products.find(
      (p) => p.productCode.toUpperCase() === code.trim().toUpperCase()
    );
    if (found) {
      setProductForDetailDrawer(found);
    } else {
      setProductsSearchQuery(code);
      setCurrentPage('products');
    }
  };

  const handleOrderCreated = (newOrder: SaleOrder) => {
    loadData();
    setOrderForInvoiceModal(newOrder);
    setIsInvoiceModalOpen(true);
    setCurrentPage('sales');
  };

  const handleOpenInvoiceModal = (order: SaleOrder) => {
    setOrderForInvoiceModal(order);
    setIsInvoiceModalOpen(true);
  };

  const handleCancelOrder = async (orderId: string, reason: string) => {
    await DataService.cancelSaleOrder(orderId, reason);
    await loadData();
  };

  const handleProcessReturn = async (input: {
    orderId: string;
    productCode: string;
    quantityReturned: number;
    reason: ReturnReason;
    itemCondition: 'RESELLABLE' | 'DAMAGED';
    refundAmount: number;
    deductDeliveryFee?: boolean;
    notes?: string;
  }) => {
    await DataService.processReturn(input);
    await loadData();
  };

  const handleRecordSettlement = async (input: {
    settlementReference: string;
    settlementDate: string;
    source: 'Steadfast Portal API' | 'Steadfast CSV Import' | 'Manual Bank Transfer';
    totalPaidAmount: number;
    matchedOrderIds: string[];
    courierDeductions?: number;
    notes?: string;
  }) => {
    await DataService.recordSettlement(input);
    await loadData();
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    paymentStatus?: PaymentStatus,
    trackingCode?: string,
    courierUpdate?: {
      consignmentId?: string;
      bookingStatus?: 'PENDING' | 'BOOKED' | 'FAILED' | 'CANCELLED';
      bookedAt?: string;
      errorMessage?: string;
    }
  ) => {
    await DataService.updateOrderStatus(orderId, status, paymentStatus, trackingCode, courierUpdate);
    await loadData();
  };

  const handleLogout = () => {
    setUser((prev) => ({ ...prev, isAuthenticated: false }));
    setCurrentPage('login');
  };

  const handleLoginSuccess = (loggedInUser: UserSession) => {
    setUser(loggedInUser);
    setCurrentPage('dashboard');
  };

  // If not authenticated or on login page, display Admin Login View
  if (!user.isAuthenticated || currentPage === 'login') {
    return (
      <AdminLoginView
        brandSettings={brandSettings}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div
      data-theme={glassTheme}
      data-glass-frost={glassFrostMode}
      className="flex h-screen w-screen overflow-hidden bg-[#050811] text-slate-100 relative font-sans selection:bg-emerald-500/30 selection:text-emerald-200"
    >
      {/* Dynamic Ambient Glass Lighting Layer */}
      <div className="dynamic-aura-container pointer-events-none select-none">
        {enableAuraMotion && (
          <>
            <div className="aura-orb-1" />
            <div className="aura-orb-2" />
            <div className="aura-orb-3" />
            <div className="aura-orb-4" />
          </>
        )}
        <div className="glass-grid-mesh" />
      </div>

      {/* Desktop Sidebar Navigation */}
      <div 
        className={`relative z-20 transition-all duration-300 ease-in-out bg-black/40 backdrop-blur-md border-r border-white/10 ${isSidebarExpanded ? 'w-64' : 'w-20'}`}
      >
        <button
          onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
          className="absolute -right-3 top-8 bg-emerald-500 text-slate-950 rounded-full p-1 border border-white/20 shadow-lg cursor-pointer z-50 hover:scale-110 transition-transform"
        >
          {isSidebarExpanded ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        <div className="h-full overflow-y-auto">
          <Sidebar
            currentPage={currentPage}
            onNavigate={setCurrentPage}
            brandSettings={brandSettings}
            user={user}
            onLogout={handleLogout}
            lowStockCount={lowStockCount}
            glassTheme={glassTheme}
            isExpanded={isSidebarExpanded}
          />
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden relative z-10">
        {/* Top Operational Status Banner (Cloud vs Demo) */}
        <DataBanner
          onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
          onRefreshData={loadData}
        />

        {/* Global Top Header with Dynamic Glass Switcher */}
        <TopHeader
          currentPage={currentPage}
          brandSettings={brandSettings}
          onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
          onQuickSearchCode={handleQuickSearchCode}
          onOpenNewSale={() => setCurrentPage('new-sale')}
          onOpenAddProduct={handleOpenAddProduct}
          onOpenAddStock={() => setCurrentPage('stock')}
          onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
          glassTheme={glassTheme}
          onThemeChange={handleThemeChange}
          enableAuraMotion={enableAuraMotion}
          onToggleAuraMotion={handleToggleAuraMotion}
          glassFrostMode={glassFrostMode}
          onFrostModeChange={handleFrostModeChange}
        />

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 lg:pb-8 relative">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentPage === 'dashboard' && (
              <DashboardView
                products={products}
                movements={movements}
                brandSettings={brandSettings}
                orders={orders}
                onNavigate={setCurrentPage}
                onOpenAddProduct={handleOpenAddProduct}
                onOpenAddStockForProduct={handleAddStockForProduct}
                onViewProduct={setProductForDetailDrawer}
              />
            )}

            {currentPage === 'new-sale' && (
              <NewSaleView
                products={products}
                customers={customers}
                videos={videos}
                onOrderCreated={handleOrderCreated}
                onNavigate={setCurrentPage}
                initialProductCodeToSell={sellProductCode}
              />
            )}

            {currentPage === 'products' && (
              <ProductsView
                products={products}
                onOpenAddModal={handleOpenAddProduct}
                onEditProduct={handleEditProduct}
                onViewProduct={setProductForDetailDrawer}
                onAddStockForProduct={handleAddStockForProduct}
                onSellProduct={(prod) => {
                  setSellProductCode(prod.productCode);
                  setCurrentPage('new-sale');
                }}
                onDeleteProduct={handleDeleteProduct}
                searchQuery={productsSearchQuery}
              />
            )}

            {currentPage === 'stock' && (
              <StockManagementView
                products={products}
                movements={movements}
                onStockUpdated={loadData}
                initialSelectedProductId={stockSelectedProductId}
              />
            )}

            {currentPage === 'sales' && (
              <SalesHistoryView
                orders={orders}
                products={products}
                onNavigateToNewSale={() => setCurrentPage('new-sale')}
                onOpenInvoice={handleOpenInvoiceModal}
                onCancelOrder={handleCancelOrder}
                onUpdateStatus={handleUpdateOrderStatus}
              />
            )}

            {currentPage === 'videos' && (
              <VideoTrackingView
                videos={videos}
                products={products}
                orders={orders}
                onVideoCreated={loadData}
                onNavigateToNewSale={() => setCurrentPage('new-sale')}
              />
            )}

            {currentPage === 'invoices' && (
              <InvoicesView
                orders={orders}
                brandSettings={brandSettings}
                onOpenPrintModal={handleOpenInvoiceModal}
              />
            )}

            {currentPage === 'courier' && (
              <CourierOrdersView
                orders={orders}
                onUpdateStatus={handleUpdateOrderStatus}
              />
            )}

            {currentPage === 'settlements' && (
              <SettlementsView
                orders={orders}
                settlements={settlements}
                onRecordSettlement={handleRecordSettlement}
              />
            )}

            {currentPage === 'returns' && (
              <ReturnsView
                returns={returns}
                orders={orders}
                products={products}
                onProcessReturn={handleProcessReturn}
              />
            )}

            {currentPage === 'customers' && (
              <CustomersView
                customers={customers}
                orders={orders}
                onNavigateToNewSale={() => setCurrentPage('new-sale')}
              />
            )}

            {currentPage === 'reports' && (
              <ReportsView
                products={products}
                orders={orders}
                videos={videos}
                returns={returns}
              />
            )}

            {currentPage === 'settings' && (
              <SettingsView
                brandSettings={brandSettings}
                onBrandSettingsUpdated={(updated) => setBrandSettings(updated)}
                onOpenFirebaseModal={() => setIsFirebaseModalOpen(true)}
              />
            )}
          </div>
        </main>
      </div>

      {/* Mobile Drawer & Mobile Sticky Bottom Bar */}
      <MobileNav
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        brandSettings={brandSettings}
        user={user}
        onLogout={handleLogout}
        isDrawerOpen={isMobileDrawerOpen}
        onCloseDrawer={() => setIsMobileDrawerOpen(false)}
        lowStockCount={lowStockCount}
      />

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        onSave={loadData}
        productToEdit={productToEdit}
      />

      {/* Product Detail & Specs Drawer */}
      <ProductDetailDrawer
        product={productForDetailDrawer}
        onClose={() => setProductForDetailDrawer(null)}
        onEdit={handleEditProduct}
        onAddStock={handleAddStockForProduct}
        movements={movements}
      />

      {/* Printable / Downloadable Invoice Modal with QR Verification */}
      <InvoicePrintModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setOrderForInvoiceModal(null);
        }}
        order={orderForInvoiceModal}
        brandSettings={brandSettings}
        onVerifyOrder={(ord) => {
          alert(`Verified Order #${ord.orderNumber} issued by ${brandSettings.brandName} for ${ord.customer.name}`);
        }}
      />

      {/* Firebase Setup Modal */}
      <FirebaseSetupModal
        isOpen={isFirebaseModalOpen}
        onClose={() => setIsFirebaseModalOpen(false)}
        onConfigSaved={loadData}
      />
    </div>
  );
}
