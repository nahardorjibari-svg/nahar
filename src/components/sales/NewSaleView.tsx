import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  User,
  Video,
  Truck,
  Calculator,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Package,
  Camera,
  Scan,
  X,
  Keyboard,
  Receipt,
  Settings,
} from 'lucide-react';
import {
  Product,
  Customer,
  VideoPost,
  SaleOrder,
  PageId,
  DailyExpense,
} from '../../types';
import { DataService, formatBDT } from '../../services/dataService';

interface NewSaleViewProps {
  products: Product[];
  customers: Customer[];
  videos: VideoPost[];
  onOrderCreated: (newOrder: SaleOrder) => void;
  onNavigate: (page: PageId) => void;
  initialProductCodeToSell?: string;
}

interface DraftOrderItem {
  productId: string;
  productCode: string;
  productName: string;
  color: string;
  size: string;
  image: string;
  currentStock: number;
  purchaseCost: number;
  defaultSellingPrice?: number | null;
  sellingPrice: number; // Actual transaction selling price
  quantity: number;
  discount: number;
  originVideoId?: string;
  originVideoTitle?: string;
  advertisedPrice?: number;
}

const BANGLADESH_DISTRICTS = [
  'Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail',
  'Chittagong', 'Bandarban', 'Brahmanbaria', 'Chandpur', "Cox's Bazar", 'Feni', 'Khagrachhari', 'Lakshmipur', 'Noakhali', 'Rangamati',
  'Sylhet', 'Habiganj', 'Moulvibazar', 'Sunamganj',
  'Rajshahi', 'Bogra', 'Chapainawabganj', 'Joypurhat', 'Naogaon', 'Natore', 'Pabna', 'Sirajganj',
  'Khulna', 'Bagerhat', 'Chuadanga', 'Jashore', 'Jhenaidah', 'Kushtia', 'Magura', 'Meherpur', 'Narail', 'Satkhira',
  'Barisal', 'Barguna', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur',
  'Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon',
  'Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur',
  'Other District',
];

export const NewSaleView: React.FC<NewSaleViewProps> = ({
  products,
  customers,
  videos,
  onOrderCreated,
  onNavigate,
  initialProductCodeToSell,
}) => {
  // Product Search & Selection
  const [productSearchInput, setProductSearchInput] = useState('');
  const [cartItems, setCartItems] = useState<DraftOrderItem[]>([]);

  useEffect(() => {
    if (initialProductCodeToSell && products.length > 0) {
      const p = products.find(prod => prod.productCode.toUpperCase() === initialProductCodeToSell.toUpperCase());
      if (p) {
        handleAddProductToCart(p);
      }
    }
  }, [initialProductCodeToSell, products]);

  // Customer State
  const [customerSearchInput, setCustomerSearchInput] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerDistrict, setCustomerDistrict] = useState('Dhaka');
  const [rawPasteText, setRawPasteText] = useState('');

  const handleSmartPasteParse = () => {
    if (!rawPasteText.trim()) return;
    const text = rawPasteText;

    // Extract Phone (Bangladesh 11 digit 01... or +880...)
    const phoneMatch = text.match(/(?:\+88)?(01[3-9]\d{8})/);
    if (phoneMatch) {
      setCustomerPhone(phoneMatch[1]);
    }

    // Extract Name
    const nameMatch = text.match(/(?:Name|নাম)\s*[:\-]\s*([^\n\r,]+)/i);
    if (nameMatch) {
      setCustomerName(nameMatch[1].trim());
    } else {
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length > 0) {
        const cleanName = lines[0].replace(/^(?:name|নাম|customer)\s*[:\-]\s*/i, '');
        if (cleanName.length > 1 && !cleanName.match(/01\d{9}/)) {
          setCustomerName(cleanName);
        }
      }
    }

    // Match District among 64 districts
    let foundDistrict = 'Dhaka';
    for (const dist of BANGLADESH_DISTRICTS) {
      const regex = new RegExp(`\\b${dist}\\b`, 'i');
      if (regex.test(text)) {
        foundDistrict = dist;
        break;
      }
    }
    setCustomerDistrict(foundDistrict);
    const isDhaka = foundDistrict === 'Dhaka';
    setDeliveryFee(isDhaka ? 70 : 130);
    setSellerCourierCost(isDhaka ? 70 : 130);

    // Extract Address
    let addressClean = text;
    if (nameMatch && nameMatch[0]) addressClean = addressClean.replace(nameMatch[0], '');
    if (phoneMatch && phoneMatch[0]) addressClean = addressClean.replace(phoneMatch[0], '');
    addressClean = addressClean.replace(/(?:address|ঠিকানা|phone|মোবাইল|number|name|নাম)\s*[:\-]/gi, '');
    const formattedAddress = addressClean.split('\n').map(l => l.trim()).filter(Boolean).join(', ');
    if (formattedAddress.length > 3) {
      setCustomerAddress(formattedAddress);
    } else {
      setCustomerAddress(text.trim());
    }

    setRawPasteText('');
  };

  // Video / Campaign Attribution
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');

  // Financial & Expense Inputs
  const [orderDiscount, setOrderDiscount] = useState<number | ''>('');
  const [deliveryFee, setDeliveryFee] = useState<number | ''>(70); // Inside Dhaka default
  const [sellerCourierCost, setSellerCourierCost] = useState<number | ''>(70);
  const [dailyExpenses, setDailyExpenses] = useState<DailyExpense[]>([]);
  const [otherExpenses, setOtherExpenses] = useState<number | ''>(0);

  // Load real daily expenses from DataService
  useEffect(() => {
    DataService.getDailyExpenses().then(setDailyExpenses).catch(console.error);
  }, []);

  // Total Stock across all available products
  const totalInventoryStock = useMemo(() => {
    return products.reduce((sum, p) => sum + Math.max(0, Number(p.currentStock) || 0), 0);
  }, [products]);

  // Total Daily Expenses recorded
  const totalDailyExpenses = useMemo(() => {
    return dailyExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [dailyExpenses]);

  // Dynamic Per Piece Expense: Total Expenses ÷ Total Inventory Stock
  const perPieceExpenseTotal = useMemo(() => {
    if (totalInventoryStock <= 0) return 0;
    return totalDailyExpenses / totalInventoryStock;
  }, [totalDailyExpenses, totalInventoryStock]);

  // Payment & Courier
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'bKash' | 'Nagad' | 'Bank Transfer' | 'Cash'>('COD');
  const [paymentStatus, setPaymentStatus] = useState<'PENDING_COD' | 'COLLECTED'>('PENDING_COD');
  const [trxId, setTrxId] = useState('');
  const [courierProvider, setCourierProvider] = useState('Steadfast Courier');
  const [orderNotes, setOrderNotes] = useState('');
  const [isInstantWalkIn, setIsInstantWalkIn] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtered product suggestions
  const productSuggestions = useMemo(() => {
    if (!productSearchInput.trim()) return [];
    const term = productSearchInput.toLowerCase();
    return products.filter(
      p =>
        p.productCode.toLowerCase().includes(term) ||
        p.name.toLowerCase().includes(term) ||
        p.color.toLowerCase().includes(term)
    );
  }, [products, productSearchInput]);

  // Filtered customer suggestions
  const customerSuggestions = useMemo(() => {
    if (!customerSearchInput.trim()) return [];
    const term = customerSearchInput.toLowerCase();
    return customers.filter(
      c => c.name.toLowerCase().includes(term) || c.phone.includes(term)
    );
  }, [customers, customerSearchInput]);

  // Auto-detect courier rate when district changes
  const handleDistrictChange = (dist: string) => {
    setCustomerDistrict(dist);
    const isInsideDhaka = dist.toLowerCase() === 'dhaka';
    const rate = isInsideDhaka ? 70 : 130;
    setDeliveryFee(rate);
    setSellerCourierCost(rate);
  };

  // Select customer from directory
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerAddress(c.address);
    setCustomerDistrict(c.district);
    setCustomerSearchInput('');
    handleDistrictChange(c.district);
  };

  // Add Product to Cart
  const handleAddProductToCart = (prod: Product) => {
    // Check if already in cart
    const existingIndex = cartItems.findIndex(i => i.productId === prod.id);

    if (existingIndex > -1) {
      const item = cartItems[existingIndex];
      if (item.quantity + 1 > prod.currentStock) {
        alert(`Cannot add more units. Available stock for ${prod.productCode} is ${prod.currentStock} pcs.`);
        return;
      }
      const updated = [...cartItems];
      updated[existingIndex].quantity += 1;
      setCartItems(updated);
    } else {
      if (prod.currentStock < 1) {
        alert(`Cannot sell "${prod.productCode}". This item is currently OUT OF STOCK.`);
        return;
      }

      // Check if selected video has a special advertised price for this product
      let initialSellingPrice = prod.defaultSellingPrice || prod.purchaseCost;
      let originVideoTitle = undefined;
      let advertisedPrice = undefined;

      if (selectedVideoId) {
        const vid = videos.find(v => v.id === selectedVideoId);
        if (vid) {
          originVideoTitle = vid.title;
          const offering = vid.productOfferings.find(
            o => o.productCode.toUpperCase() === prod.productCode.toUpperCase()
          );
          if (offering && offering.advertisedPrice > 0) {
            initialSellingPrice = offering.advertisedPrice;
            advertisedPrice = offering.advertisedPrice;
          }
        }
      }

      const newItem: DraftOrderItem = {
        productId: prod.id,
        productCode: prod.productCode,
        productName: prod.name,
        color: prod.color,
        size: prod.size,
        image: prod.images[0] || '/src/assets/images/three_piece_royal_floral_1792247226094.jpg',
        currentStock: prod.currentStock,
        purchaseCost: prod.purchaseCost,
        defaultSellingPrice: prod.defaultSellingPrice,
        sellingPrice: initialSellingPrice,
        quantity: 1,
        discount: 0,
        originVideoId: selectedVideoId || undefined,
        originVideoTitle,
        advertisedPrice,
      };

      setCartItems([...cartItems, newItem]);
    }

    setProductSearchInput('');
    setErrorMessage(null);
  };

  // USB Barcode Scanner (Keyboard Emulation on PC & Mobile)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = productSearchInput.trim().toUpperCase();
      if (!code) return;

      const exactMatch = products.find(
        (p) => p.productCode.toUpperCase() === code
      );
      if (exactMatch) {
        handleAddProductToCart(exactMatch);
        return;
      }

      if (productSuggestions.length === 1) {
        handleAddProductToCart(productSuggestions[0]);
        return;
      }

      if (productSuggestions.length === 0) {
        setErrorMessage(`Product with code "${productSearchInput}" was not found.`);
      }
    }
  };

  // Camera Barcode / QR Scanner
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setCameraError(null);
    setIsCameraModalOpen(true);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported by your browser.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      setCameraError(err.message || 'Camera permission denied or camera not available.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraModalOpen(false);
  };

  const handleManualCameraSelect = (prod: Product) => {
    handleAddProductToCart(prod);
    stopCamera();
  };

  const handleUpdateItemSellingPrice = (index: number, price: number) => {
    const updated = [...cartItems];
    updated[index].sellingPrice = price;
    setCartItems(updated);
  };

  const handleUpdateItemQuantity = (index: number, qty: number) => {
    const updated = [...cartItems];
    const item = updated[index];
    if (qty > item.currentStock) {
      alert(`Cannot exceed available stock (${item.currentStock} pcs) for ${item.productCode}.`);
      return;
    }
    if (qty <= 0) return;
    item.quantity = qty;
    setCartItems(updated);
  };

  const handleUpdateItemDiscount = (index: number, disc: number) => {
    const updated = [...cartItems];
    updated[index].discount = disc;
    setCartItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  // Calculations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalCogs = 0;
    let totalItemsCount = 0;

    cartItems.forEach(item => {
      const itemTotal = (item.sellingPrice * item.quantity) - (item.discount || 0);
      subtotal += itemTotal;
      totalCogs += item.purchaseCost * item.quantity;
      totalItemsCount += item.quantity;
    });

    const oDiscount = Number(orderDiscount) || 0;
    const dFee = Number(deliveryFee) || 0;
    const sCourier = Number(sellerCourierCost) || dFee;
    
    // Per-piece custom expenses multiplied by number of pieces sold
    const piecesCount = totalItemsCount > 0 ? totalItemsCount : (cartItems.length > 0 ? 1 : 0);
    const totalAllocatedExpenses = perPieceExpenseTotal * (piecesCount || 1);
    const other = Number(otherExpenses) || 0;

    const totalPayable = (subtotal - oDiscount) + dFee;
    const grossProfit = (subtotal - oDiscount) - totalCogs;
    const courierDeficit = Math.max(0, sCourier - dFee);
    const totalExpenses = totalAllocatedExpenses + other + courierDeficit;
    const netProfit = grossProfit - totalExpenses;

    return {
      subtotal,
      totalCogs,
      totalItemsCount,
      totalPayable,
      grossProfit,
      totalAllocatedExpenses,
      totalExpenses,
      netProfit,
    };
  }, [cartItems, orderDiscount, deliveryFee, sellerCourierCost, perPieceExpenseTotal, otherExpenses]);

  // Submit Order
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      setErrorMessage('Please add at least one 3-piece product to the sale order.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setErrorMessage('Please complete Customer Name, Phone, and Delivery Address.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const selectedVideo = videos.find(v => v.id === selectedVideoId);

      const newOrder = await DataService.createSaleOrder({
        customer: {
          id: selectedCustomerId || undefined,
          name: customerName.trim(),
          phone: customerPhone.trim(),
          address: customerAddress.trim(),
          district: customerDistrict,
        },
        items: cartItems.map(item => ({
          productId: item.productId,
          sellingPrice: item.sellingPrice,
          quantity: item.quantity,
          discount: item.discount,
          originVideoId: selectedVideoId || undefined,
          originVideoTitle: selectedVideo?.title,
          advertisedPrice: item.advertisedPrice,
        })),
        orderDiscount: Number(orderDiscount) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        sellerCourierCost: Number(sellerCourierCost) || Number(deliveryFee) || 0,
        packagingCost: Math.round(calculations.totalAllocatedExpenses),
        advertisingCost: 0,
        otherExpenses: Number(otherExpenses) || 0,
        paymentMethod,
        paymentStatus: paymentMethod === 'COD' ? paymentStatus : 'COLLECTED',
        trxId: trxId.trim() || undefined,
        courierProvider,
        courierZone: customerDistrict.toLowerCase() === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka',
        originVideoId: selectedVideoId || undefined,
        originVideoTitle: selectedVideo?.title,
        notes: orderNotes.trim(),
      });

      onOrderCreated(newOrder);
      alert(`Order ${newOrder.orderNumber} successfully confirmed! Stock deducted and QR invoice generated.`);
      onNavigate('sales');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to confirm sale order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner / Heading */}
      <div className="glass-panel p-4 rounded-2xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div>
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <span>New Sale / Order Entry (নতুন বিক্রয় ও মেমো)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Search 3-piece products by code, customize selling price per item, allocate marketing expenses, and deduct stock safely.
          </p>
        </div>

        <button
          onClick={() => onNavigate('sales')}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold underline cursor-pointer"
        >
          View Sales Ledger
        </button>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2.5 backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Instant Walk-In / Hand-to-Hand Sale Banner */}
      <div className="glass-card p-4 rounded-2xl border border-amber-500/35 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shrink-0 text-base">
            ⚡
          </div>
          <div>
            <h4 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              <span>Instant Walk-In / Hand-to-Hand Sale Mode</span>
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded text-[10px] font-mono">No Courier Needed</span>
            </h4>
            <p className="text-[11px] text-slate-300">Direct in-person sales where products are handed to the customer directly. Bypasses courier auto-shipping.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            const nextState = !isInstantWalkIn;
            setIsInstantWalkIn(nextState);
            if (nextState) {
              setDeliveryFee(0);
              setSellerCourierCost(0);
              setPaymentMethod('Cash');
              setPaymentStatus('COLLECTED');
              setCourierProvider('Instant Walk-In (Direct)');
              if (!customerName.trim()) setCustomerName('Walk-in Customer');
              if (!customerPhone.trim()) setCustomerPhone('01700000000');
              if (!customerAddress.trim()) setCustomerAddress('Direct In-Person Walk-In Store Sale');
            } else {
              setDeliveryFee(70);
              setSellerCourierCost(70);
              setPaymentMethod('COD');
              setPaymentStatus('PENDING_COD');
              setCourierProvider('Steadfast Courier');
              if (customerName === 'Walk-in Customer') setCustomerName('');
              if (customerPhone === '01700000000') setCustomerPhone('');
              if (customerAddress === 'Direct In-Person Walk-In Store Sale') setCustomerAddress('');
            }
          }}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
            isInstantWalkIn
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
          }`}
        >
          <span>{isInstantWalkIn ? '✓ Instant Walk-In Active' : 'Enable Instant Walk-In'}</span>
        </button>
      </div>

      <form onSubmit={handleConfirmOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 Cols): Products Selection & Line Items */}
        <div className="lg:col-span-7 space-y-5">
          {/* Section: Product Code Search */}
          <div className="glass-card glass-shine-top p-5 rounded-2xl border border-white/15 space-y-3">
            <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                Step 1: Select 3-Piece by Product Code
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Type RP-001, RP-002...</span>
            </h3>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search Product Code (e.g. RP-001) or scan barcode..."
                  value={productSearchInput}
                  onChange={e => setProductSearchInput(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-9 pr-3 py-2 glass-input rounded-xl text-xs font-mono-numbers uppercase placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-400 text-white"
                />
              </div>

              <button
                type="button"
                onClick={startCamera}
                className="px-3.5 py-2 glass-card hover:border-white/30 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all border border-white/15 shrink-0 cursor-pointer"
                title="Open Camera Barcode / QR Scanner"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Camera Scan</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <Keyboard className="w-3 h-3 text-slate-400" />
              <span>USB / Bluetooth barcode scanner enabled. Pressing Enter after scanning adds item automatically.</span>
            </div>

            {/* Suggestions Dropdown */}
            {productSuggestions.length > 0 && (
              <div className="glass-panel-elevated border border-white/20 rounded-xl overflow-hidden divide-y divide-white/10 max-h-56 overflow-y-auto shadow-2xl">
                {productSuggestions.map(prod => {
                  const isOutOfStock = prod.currentStock <= 0;
                  return (
                    <div
                      key={prod.id}
                      onClick={() => !isOutOfStock && handleAddProductToCart(prod)}
                      className={`p-3 flex items-center justify-between gap-3 text-xs transition-colors ${
                        isOutOfStock
                          ? 'opacity-40 bg-black/40 cursor-not-allowed'
                          : 'hover:bg-white/10 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.images[0] || '/src/assets/images/three_piece_royal_floral_1792247226094.jpg'}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-white/20 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono-numbers font-bold text-white bg-white/10 px-1.5 py-0.5 rounded text-[11px] border border-white/10">
                              {prod.productCode}
                            </span>
                            <span className="text-[11px] text-slate-300 truncate font-medium">{prod.name}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 font-mono-numbers">
                            Cost: <strong className="text-slate-300">{formatBDT(prod.purchaseCost)}</strong> · Default: {prod.defaultSellingPrice ? formatBDT(prod.defaultSellingPrice) : 'Unset'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono-numbers font-bold text-xs block ${
                            isOutOfStock ? 'text-rose-400' : 'text-emerald-400'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : `${prod.currentStock} pcs available`}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-semibold hover:underline">
                          {isOutOfStock ? 'Unavailable' : '+ Add to Sale'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Video / Live Post Attribution */}
          <div className="glass-card glass-shine-top p-4 rounded-2xl border border-white/15 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-sky-400" />
                <span>Link Originating Video / Live Post (Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => onNavigate('videos')}
                className="text-[11px] text-sky-400 hover:underline"
              >
                + Manage Videos
              </button>
            </div>
            <select
              value={selectedVideoId}
              onChange={e => setSelectedVideoId(e.target.value)}
              className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value="" className="bg-slate-900 text-white">No Specific Video (Direct Walk-in / General Web Order)</option>
              {videos.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                  {v.platform}: {v.title} ({v.productCodes.join(', ')})
                </option>
              ))}
            </select>
          </div>

          {/* Section: Line Items in Cart */}
          <div className="glass-panel rounded-2xl border border-white/15 shadow-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <h3 className="font-semibold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                <span>Selected Line Items ({cartItems.length})</span>
              </h3>
              <span className="text-xs text-slate-400">
                Total Pieces: <strong className="font-mono-numbers text-white">{calculations.totalItemsCount}</strong>
              </span>
            </div>

            {cartItems.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <Package className="w-8 h-8 mx-auto text-slate-500" />
                <p className="text-xs">No 3-piece items added to order yet.</p>
                <p className="text-[11px] text-slate-500">Search by product code above to add items.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {cartItems.map((item, idx) => {
                  const lineTotal = (item.sellingPrice * item.quantity) - item.discount;
                  const lineProfit = lineTotal - (item.purchaseCost * item.quantity);

                  return (
                    <div key={item.productId} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.image}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover border border-white/20 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono-numbers font-bold text-white text-xs px-2 py-0.5 bg-white/10 rounded border border-white/10">
                                {item.productCode}
                              </span>
                              <span className="text-xs font-semibold text-white truncate">{item.productName}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {item.color} · Stock Left: <strong className="font-mono-numbers text-slate-200">{item.currentStock}</strong> pcs
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Interactive Item Pricing & Quantity Controls */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 bg-black/30 p-3 rounded-xl border border-white/10 text-xs">
                        {/* Cost preview */}
                        <div>
                          <span className="text-[10px] text-slate-400 block">Unit Cost (Wholesale)</span>
                          <span className="font-mono-numbers font-semibold text-slate-300">
                            {formatBDT(item.purchaseCost)}
                          </span>
                        </div>

                        {/* Actual Selling Price (Editable!) */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-300 block mb-0.5">
                            Actual Selling Price (৳) <span className="text-rose-400">*</span>
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">৳</span>
                            <input
                              type="number"
                              min="0"
                              value={item.sellingPrice}
                              onChange={e => handleUpdateItemSellingPrice(idx, Number(e.target.value))}
                              required
                              className="w-full pl-6 pr-2 py-1 glass-input rounded font-mono-numbers font-bold text-white text-xs focus:ring-1 focus:ring-emerald-400"
                            />
                          </div>
                          {item.advertisedPrice && (
                            <span className="text-[9px] text-sky-400 block mt-0.5">
                              Video rate: {formatBDT(item.advertisedPrice)}
                            </span>
                          )}
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="text-[10px] font-semibold text-slate-300 block mb-0.5">
                            Quantity (Pcs)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={item.currentStock}
                            value={item.quantity}
                            onChange={e => handleUpdateItemQuantity(idx, Number(e.target.value))}
                            required
                            className="w-full px-2 py-1 glass-input rounded font-mono-numbers font-bold text-xs focus:ring-1 focus:ring-emerald-400 text-white"
                          />
                          <div className="flex items-center justify-between text-[9px] text-slate-400 mt-0.5">
                            <span>Max: {item.currentStock}</span>
                            <span className="text-[8px] text-slate-500">স্টক</span>
                          </div>
                          {/* Auto Per Piece Expense Display from Daily Expenses Page */}
                          <div className="mt-1 px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[9px] text-amber-300">
                            <div className="flex justify-between items-center">
                              <span>প্রতি পিস খরচ:</span>
                              <strong className="font-mono text-amber-200">৳{perPieceExpenseTotal.toFixed(1)}</strong>
                            </div>
                            <div className="text-[8px] text-slate-400 flex justify-between mt-0.5">
                              <span>{item.quantity} পিসে খরচ:</span>
                              <span className="font-mono text-amber-300 font-semibold">৳{(item.quantity * perPieceExpenseTotal).toFixed(0)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Line Total & Profit */}
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Line Amount / Profit</span>
                          <span className="font-mono-numbers font-bold text-white text-xs block">
                            {formatBDT(lineTotal)}
                          </span>
                          <span className="font-mono-numbers text-[10px] text-emerald-400 font-semibold">
                            +{formatBDT(lineProfit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 Cols): Customer Details, Financial Breakdown & Confirm */}
        <div className="lg:col-span-5 space-y-5">
          {/* Customer Details Box */}
          <div className="glass-card glass-shine-top p-5 rounded-2xl border border-white/15 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Step 2: Customer Details</span>
              </h3>
              {selectedCustomerId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCustomerId('');
                    setCustomerName('');
                    setCustomerPhone('');
                    setCustomerAddress('');
                  }}
                  className="text-[11px] text-amber-400 hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* AI Smart Paste Box */}
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/35 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                  ✨ Smart AI Paste Box (এক ক্লিকে অটো-ফিল)
                </span>
                <span className="text-[10px] text-slate-400">Paste Name, Number & Address</span>
              </div>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  placeholder="Paste e.g. Name-Md Johurul, Number-01925254746, Address..."
                  value={rawPasteText}
                  onChange={e => setRawPasteText(e.target.value)}
                  className="w-full px-2.5 py-1.5 glass-input rounded-lg text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleSmartPasteParse}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Auto-Fill
                </button>
              </div>
            </div>

            {/* Customer Search Auto-fill */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Lookup existing customer by name or phone..."
                value={customerSearchInput}
                onChange={e => setCustomerSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 glass-input rounded-xl text-xs text-white"
              />
            </div>

            {customerSuggestions.length > 0 && (
              <div className="glass-panel-elevated border border-white/20 rounded-xl divide-y divide-white/10 max-h-40 overflow-y-auto shadow-xl text-xs">
                {customerSuggestions.map(c => (
                  <div
                    key={c.id}
                    onClick={() => handleSelectCustomer(c)}
                    className="p-2.5 hover:bg-white/10 cursor-pointer flex justify-between"
                  >
                    <div>
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono-numbers">{c.phone} · {c.district}</p>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-semibold self-center">Select</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2.5 text-xs pt-1">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Customer Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tasnim Sultana"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  required
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Phone Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="+880 1712-XXXXXX"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs font-mono-numbers text-white focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  District / Delivery Region <span className="text-rose-400">*</span>
                </label>
                <select
                  value={customerDistrict}
                  onChange={e => handleDistrictChange(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-400"
                >
                  {BANGLADESH_DISTRICTS.map(dist => (
                    <option key={dist} value={dist} className="bg-slate-900 text-white">
                      {dist} {dist === 'Dhaka' ? '(Inside Dhaka - ৳70)' : '(Outside Dhaka - ৳130)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Full Home Delivery Address <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="House number, road number, area landmarks..."
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  required
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Expenses & Payment Box */}
          <div className="glass-card glass-shine-top p-5 rounded-2xl border border-white/15 space-y-3 text-xs">
            <h3 className="font-semibold text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-slate-400" />
              <span>Step 3: Expenses, Courier & Payment</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Delivery Charge (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={deliveryFee}
                  onChange={e => setDeliveryFee(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-1.5 glass-input rounded-lg font-mono-numbers text-white"
                />
                <span className="text-[10px] text-slate-400">Charged to customer</span>
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Order Discount (৳)</label>
                <input
                  type="number"
                  min="0"
                  value={orderDiscount}
                  onChange={e => setOrderDiscount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="0"
                  className="w-full px-3 py-1.5 glass-input rounded-lg font-mono-numbers text-white"
                />
              </div>

            </div>

            {/* Dynamic Daily Expense Allocation from 'খরচ' Page */}
            <div className="pt-3 border-t border-white/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-amber-400" />
                    <span>খরচ পেজ থেকে প্রতি পিস বণ্টন (Daily Expense Allocation)</span>
                  </label>
                  <p className="text-[10px] text-slate-400">
                    মোট খরচ (৳{totalDailyExpenses.toLocaleString()}) ÷ মোট স্টক ({totalInventoryStock} পিস) = ৳{perPieceExpenseTotal.toFixed(2)} / পিস
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('expenses')}
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                >
                  <span>খরচ পেজে যান</span>
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                </button>
              </div>

              {/* Dynamic Allocation Box */}
              <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">হিসাবকৃত প্রতি পিস খরচ:</span>
                  <strong className="text-emerald-400 font-mono text-sm">৳{perPieceExpenseTotal.toFixed(2)} / পিস</strong>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
                  <span className="text-slate-400">
                    এই অর্ডারে মোট বণ্টন ({calculations.totalItemsCount || 1} পিস × ৳{perPieceExpenseTotal.toFixed(2)}):
                  </span>
                  <span className="font-mono font-bold text-amber-300">
                    -{formatBDT(calculations.totalAllocatedExpenses)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="pt-2 border-t border-white/10">
              <label className="block font-semibold text-slate-300 mb-1">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {(['COD', 'bKash', 'Nagad', 'Cash'] as const).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m);
                      setPaymentStatus(m === 'COD' ? 'PENDING_COD' : 'COLLECTED');
                    }}
                    className={`py-1.5 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                      paymentMethod === m
                        ? 'bg-white/20 text-white border-white/30 shadow-[0_0_12px_rgba(255,255,255,0.2)]'
                        : 'glass-card text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {paymentMethod !== 'COD' && (
                <div className="mt-2">
                  <label className="block font-medium text-slate-300 mb-1">Transaction ID / Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. BK8910482"
                    value={trxId}
                    onChange={e => setTrxId(e.target.value)}
                    className="w-full px-3 py-1.5 glass-input rounded-lg text-xs font-mono-numbers text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Real-Time Financial & Profit Summary */}
          <div className="glass-panel-elevated p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] space-y-3 text-xs border border-white/20 relative overflow-hidden">
            <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent" />
            <h4 className="font-bold text-amber-300 text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Financial Audit & Profit Summary</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
            </h4>

            <div className="space-y-1.5 font-mono-numbers">
              <div className="flex justify-between text-slate-300">
                <span>Items Subtotal:</span>
                <span>{formatBDT(calculations.subtotal)}</span>
              </div>

              {Number(orderDiscount) > 0 && (
                <div className="flex justify-between text-rose-300">
                  <span>Order Discount:</span>
                  <span>-{formatBDT(Number(orderDiscount))}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span>Delivery Fee (Customer):</span>
                <span>+{formatBDT(Number(deliveryFee))}</span>
              </div>

              <div className="flex justify-between pt-2 border-t border-white/10 text-sm font-bold text-white">
                <span>Total Payable Amount:</span>
                <span className="text-emerald-400 text-base">{formatBDT(calculations.totalPayable)}</span>
              </div>

              <div className="pt-2 border-t border-white/10 space-y-1 text-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Cost of Goods Sold (COGS):</span>
                  <span>{formatBDT(calculations.totalCogs)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Margin:</span>
                  <span className="text-emerald-400 font-bold">+{formatBDT(calculations.grossProfit)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <span>Allocated Expenses (খরচ বণ্টন):</span>
                    <button
                      type="button"
                      onClick={() => onNavigate('expenses')}
                      className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      (খরচ পেজ)
                    </button>
                  </div>
                  <span className="text-amber-300 font-mono font-semibold">-{formatBDT(calculations.totalAllocatedExpenses)}</span>
                </div>
                <div className="text-[10px] text-slate-400 flex justify-between pr-0.5">
                  <span>হিসাব: {calculations.totalItemsCount || 1} পিস × ৳{perPieceExpenseTotal.toFixed(2)}</span>
                  <span className="text-slate-400 font-mono text-[9px]">(মোট স্টক {totalInventoryStock} পিস)</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-white/10 text-xs font-bold text-emerald-300">
                  <span>Projected Net Profit:</span>
                  <span className="text-sm">+{formatBDT(calculations.netProfit)}</span>
                </div>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting || cartItems.length === 0}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.35)] disabled:opacity-50 border border-emerald-300/40"
              >
                <CheckCircle2 className="w-5 h-5 text-slate-950" />
                <span>{isSubmitting ? 'Processing Safe Deduction...' : 'Confirm Sale & Generate Invoice'}</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-2">
                Stock will be atomically updated. QR code verification link generated automatically.
              </p>
            </div>
          </div>
        </div>
      </form>

      {/* Camera Barcode / QR Scanner Modal */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel-elevated rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white/25 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-sm">
                  Live Camera Barcode / Hangtag Scanner
                </h3>
              </div>
              <button
                type="button"
                onClick={stopCamera}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {cameraError ? (
              <div className="p-4 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-300 text-xs space-y-2 backdrop-blur-md">
                <div className="flex items-center gap-2 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Camera Access Notice</span>
                </div>
                <p>{cameraError}</p>
                <p className="text-[11px] text-slate-300 pt-1">
                  You can also use manual product code search or any USB / Bluetooth handheld barcode scanner on PC or mobile.
                </p>
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-white/15">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Viewfinder Target Overlay */}
                <div className="absolute inset-8 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-rose-500/80 animate-pulse shadow-sm" />
                </div>
                <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/90 bg-black/60 py-1">
                  Center 3-piece barcode or hangtag inside the frame
                </div>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-300 block">
                Quick Select Available 3-Pieces:
              </span>
              <div className="max-h-40 overflow-y-auto divide-y divide-white/10 border border-white/10 rounded-xl bg-black/30">
                {products
                  .filter((p) => p.currentStock > 0)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleManualCameraSelect(p)}
                      className="w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <span className="font-mono-numbers font-bold text-white">
                        {p.productCode} - {p.name}
                      </span>
                      <span className="text-emerald-400 font-semibold font-mono-numbers">
                        {p.currentStock} pcs
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={stopCamera}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all cursor-pointer border border-white/20"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

