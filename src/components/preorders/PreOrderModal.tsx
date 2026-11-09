import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ClipboardPaste,
  User,
  Phone,
  MapPin,
  Building2,
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  DollarSign,
  Truck,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import { PreOrder, PreOrderItem, Product } from '../../types';
import { formatBDT } from '../../services/dataService';
import { parseCustomerPastedText, BD_DISTRICTS } from '../../utils/customerTextParser';

interface PreOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preOrder: PreOrder) => void;
  products: Product[];
  preOrderToEdit?: PreOrder | null;
}

export const PreOrderModal: React.FC<PreOrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  products,
  preOrderToEdit,
}) => {
  const isEditing = !!preOrderToEdit;

  // Auto-fill raw input state
  const [pastedMessage, setPastedMessage] = useState('');
  const [autoFillSuccess, setAutoFillSuccess] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('ঢাকা');
  const [fullAddress, setFullAddress] = useState('');
  const [courierName, setCourierName] = useState('Steadfast Courier');
  const [deliveryFee, setDeliveryFee] = useState<number>(70);
  const [advancePayment, setAdvancePayment] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Items in pre-order
  const [items, setItems] = useState<PreOrderItem[]>([]);

  // Selected product to add
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemCustomPrice, setItemCustomPrice] = useState<number | ''>('');

  // Validation
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-set delivery fee when district changes
  useEffect(() => {
    if (!isEditing) {
      if (district.toLowerCase().includes('ঢাকা') || district.toLowerCase().includes('dhaka')) {
        setDeliveryFee(70);
      } else {
        setDeliveryFee(130);
      }
    }
  }, [district, isEditing]);

  // Load existing data when editing or opening
  useEffect(() => {
    if (preOrderToEdit) {
      setCustomerName(preOrderToEdit.customerName || '');
      setPhone(preOrderToEdit.phone || '');
      setDistrict(preOrderToEdit.district || 'ঢাকা');
      setFullAddress(preOrderToEdit.fullAddress || '');
      setCourierName(preOrderToEdit.courierName || 'Steadfast Courier');
      setDeliveryFee(preOrderToEdit.deliveryFee !== undefined ? preOrderToEdit.deliveryFee : 70);
      setAdvancePayment(preOrderToEdit.advancePayment || 0);
      setNotes(preOrderToEdit.notes || '');
      setItems(preOrderToEdit.items || []);
      setPastedMessage(preOrderToEdit.rawPastedText || '');
    } else {
      // Defaults for new pre-order
      setCustomerName('');
      setPhone('');
      setDistrict('ঢাকা');
      setFullAddress('');
      setCourierName('Steadfast Courier');
      setDeliveryFee(70);
      setAdvancePayment(0);
      setNotes('');
      setPastedMessage('');
      setAutoFillSuccess(false);
      setErrorMessage(null);

      // Default item from products if available (e.g. Coconut Oil or 3-Piece)
      if (products.length > 0) {
        const defaultProd = products[0];
        setItems([
          {
            productId: defaultProd.id,
            productCode: defaultProd.productCode,
            productName: defaultProd.name,
            category: defaultProd.category,
            image: defaultProd.images?.[0] || '',
            unitPrice: defaultProd.defaultSellingPrice || defaultProd.purchaseCost || 650,
            quantity: 1,
            totalPrice: defaultProd.defaultSellingPrice || defaultProd.purchaseCost || 650,
          },
        ]);
      } else {
        setItems([]);
      }
    }
  }, [preOrderToEdit, isOpen, products]);

  // Magic Auto-Fill function
  const handleAutoFill = () => {
    if (!pastedMessage.trim()) {
      setErrorMessage('অনুগ্রহ করে কাস্টমারের মেসেজ বক্সটিতে পেস্ট করুন।');
      return;
    }

    const parsed = parseCustomerPastedText(pastedMessage);

    let filledCount = 0;
    if (parsed.customerName) {
      setCustomerName(parsed.customerName);
      filledCount++;
    }
    if (parsed.phone) {
      setPhone(parsed.phone);
      filledCount++;
    }
    if (parsed.district) {
      setDistrict(parsed.district);
      filledCount++;
    }
    if (parsed.fullAddress) {
      setFullAddress(parsed.fullAddress);
      filledCount++;
    }
    if (parsed.detectedAdvance) {
      setAdvancePayment(parsed.detectedAdvance);
    }

    if (filledCount > 0) {
      setAutoFillSuccess(true);
      setErrorMessage(null);
      setTimeout(() => setAutoFillSuccess(false), 3500);
    } else {
      setErrorMessage('মেসেজ থেকে কাস্টমারের তথ্য শনাক্ত করা যায়নি। নিচে নিজে লিখে দিন।');
    }
  };

  // Add Item to Order
  const handleAddItem = () => {
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    const price = itemCustomPrice !== '' ? Number(itemCustomPrice) : (prod.defaultSellingPrice || 650);
    const qty = Math.max(1, itemQuantity);

    const existingIndex = items.findIndex((i) => i.productId === prod.id);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].totalPrice = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          productId: prod.id,
          productCode: prod.productCode,
          productName: prod.name,
          category: prod.category,
          image: prod.images?.[0] || '',
          unitPrice: price,
          quantity: qty,
          totalPrice: price * qty,
        },
      ]);
    }

    // Reset picker
    setSelectedProductId('');
    setItemQuantity(1);
    setItemCustomPrice('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQty = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    const updated = [...items];
    updated[index].quantity = newQty;
    updated[index].totalPrice = updated[index].unitPrice * newQty;
    setItems(updated);
  };

  // Totals
  const itemsSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalAmount = itemsSubtotal + (Number(deliveryFee) || 0);
  const dueAmount = Math.max(0, totalAmount - (Number(advancePayment) || 0));

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      setErrorMessage('👤 কাস্টমারের নাম লিখুন।');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('📞 মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!fullAddress.trim()) {
      setErrorMessage('📍 সম্পূর্ণ ঠিকানা লিখুন।');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('📦 অনুগ্রহ করে অন্তত একটি পণ্য যোগ করুন।');
      return;
    }

    const orderNumber = preOrderToEdit?.orderNumber || `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const savedRecord: PreOrder = {
      id: preOrderToEdit?.id || `pre-${Date.now()}`,
      orderNumber,
      customerName: customerName.trim(),
      phone: phone.trim(),
      district: district.trim(),
      fullAddress: fullAddress.trim(),
      items,
      advancePayment: Number(advancePayment) || 0,
      deliveryFee: Number(deliveryFee) || 0,
      totalAmount,
      dueAmount,
      courierName,
      rawPastedText: pastedMessage,
      notes: notes.trim(),
      status: preOrderToEdit?.status || 'PENDING',
      createdAt: preOrderToEdit?.createdAt || new Date().toISOString(),
      doneAt: preOrderToEdit?.doneAt,
    };

    onSave(savedRecord);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel-elevated rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col border border-white/20 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {isEditing ? 'প্রি-অর্ডার এডিট করুন' : 'নতুন প্রি-অর্ডার এন্ট্রি (Pre-Order Entry)'}
              </h3>
              <p className="text-xs text-slate-400">
                কাস্টমারের নাম, ঠিকানা, পণ্য ও অগ্রিম/বাকি তথ্য লিখে বা সরাসরি পেস্ট করে শিটে সেভ করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. MAGIC AUTO-FILL FROM CUSTOMER MESSAGE */}
          <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                <span>কাস্টমারের মেসেজ পেস্ট করুন (Auto-fill Magic):</span>
              </label>
              {autoFillSuccess && (
                <span className="text-xs text-emerald-300 font-bold flex items-center gap-1 animate-pulse">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>অটো ফিলাপ সফল হয়েছে!</span>
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                value={pastedMessage}
                onChange={(e) => setPastedMessage(e.target.value)}
                placeholder={'এখানে কাস্টমারের পুরো মেসেজ পেস্ট করুন, যেমন:\n👤 আপনার নাম: রহিমা আক্তার\n📞 মোবাইল নম্বর: 01712345678\n🏙️ জেলা: ঢাকা\n📍 সম্পূর্ণ ঠিকানা: বাসা ১২, রোড ৩, মিরপুর ১০, ঢাকা'}
                rows={3}
                className="flex-1 px-3 py-2 glass-input rounded-xl text-xs font-sans text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-400 resize-none"
              />
              <button
                type="button"
                onClick={handleAutoFill}
                className="py-2.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex sm:flex-col items-center justify-center gap-1 shadow-md cursor-pointer shrink-0 transition-all border border-emerald-300/40"
              >
                <ClipboardPaste className="w-4 h-4" />
                <span>🪄 অটো ফিলাপ</span>
              </button>
            </div>
          </div>

          {/* 2. CUSTOMER DETAILS GRID */}
          <div className="p-4 glass-card rounded-xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>কাস্টমারের তথ্য (Customer Details)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  👤 আপনার নাম (Customer Name) *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="যেমন: সুমাইয়া তাসনিম"
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  📞 মোবাইল নম্বর (Phone Number) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: 017XXXXXXXX"
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs font-mono text-emerald-300 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              {/* District Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  🏙️ জেলা (District) *
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  {BD_DISTRICTS.map((d) => {
                    const bng = d.split(' ')[0];
                    return (
                      <option key={d} value={bng} className="bg-slate-900 text-white">
                        {d}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Courier Partner */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  🚚 কুরিয়ার পার্টনার (Courier Service)
                </label>
                <select
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="Steadfast Courier" className="bg-slate-900 text-white">Steadfast Courier (স্টিডফাস্ট)</option>
                  <option value="Pathao Courier" className="bg-slate-900 text-white">Pathao Courier (পাঠাও)</option>
                  <option value="RedX Logistics" className="bg-slate-900 text-white">RedX Logistics (রেডএক্স)</option>
                  <option value="Paperfly" className="bg-slate-900 text-white">Paperfly</option>
                  <option value="Showroom Pick / Hand Delivery" className="bg-slate-900 text-white">শোরুম থেকে নেওয়া / হ্যান্ড ডেলিভারি</option>
                </select>
              </div>

              {/* Full Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  📍 সম্পূর্ণ ঠিকানা (Full Delivery Address) *
                </label>
                <input
                  type="text"
                  required
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="বাসা নং, রোড নং, এলাকা / থানা, পোস্ট কোড..."
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* 3. PRODUCT DROPDOWN & ITEMS TABLE */}
          <div className="p-4 glass-card rounded-xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 border-b border-white/10 pb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-emerald-400" />
                <span>অর্ডারের পণ্যসমূহ (Selected Products)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {items.length} টি আইটেম
              </span>
            </h4>

            {/* Product Selector Dropdown Row */}
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-center gap-2">
              <div className="flex-1 w-full">
                <select
                  value={selectedProductId}
                  onChange={(e) => {
                    setSelectedProductId(e.target.value);
                    const found = products.find((p) => p.id === e.target.value);
                    if (found) {
                      setItemCustomPrice(found.defaultSellingPrice || found.purchaseCost || 650);
                    }
                  }}
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white bg-slate-900 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="" className="bg-slate-900 text-slate-400">
                    -- ক্যাটালগ থেকে প্রোডাক্ট বাছাই করুন --
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                      [{p.productCode}] {p.name} — মূল্য: {formatBDT(p.defaultSellingPrice || 0)} (স্টক: {p.currentStock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="w-20">
                  <input
                    type="number"
                    min="1"
                    value={itemQuantity}
                    onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    placeholder="পরিমাণ"
                    className="w-full px-2 py-2 glass-input rounded-xl text-xs text-center font-mono font-bold text-white"
                    title="পরিমাণ"
                  />
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    value={itemCustomPrice}
                    onChange={(e) => setItemCustomPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="দর (৳)"
                    className="w-full px-2 py-2 glass-input rounded-xl text-xs text-center font-mono font-bold text-emerald-300"
                    title="প্রতি পিসের মূল্য"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                  className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>যোগ করুন</span>
                </button>
              </div>
            </div>

            {/* Current Items List */}
            {items.length === 0 ? (
              <p className="text-center text-xs text-slate-500 py-4 italic">
                কোনো পণ্য যোগ করা হয়নি। উপরের ড্রপডাউন থেকে পণ্য সিলেক্ট করে 'যোগ করুন' বাটনে চাপ দিন।
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-white/15 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                          📦
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-white truncate">{item.productName}</div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span className="font-mono bg-white/10 px-1.5 py-0.2 rounded text-emerald-300">
                            {item.productCode}
                          </span>
                          <span>{item.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center border border-white/20 rounded-lg overflow-hidden bg-black/40">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, item.quantity - 1)}
                          className="px-2 py-1 text-slate-300 hover:text-white hover:bg-white/10"
                        >
                          -
                        </button>
                        <span className="px-2.5 py-1 font-mono font-bold text-white">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(idx, item.quantity + 1)}
                          className="px-2 py-1 text-slate-300 hover:text-white hover:bg-white/10"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right w-20">
                        <span className="font-mono font-bold text-emerald-300 block text-xs">
                          {formatBDT(item.totalPrice)}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono block">
                          @{formatBDT(item.unitPrice)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. FINANCIALS: ADVANCE, DELIVERY, COD DUE */}
          <div className="p-4 glass-card rounded-xl border border-white/10 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 border-b border-white/10 pb-1.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>পেমেন্ট ও হিসাব বিবরণী (Financial Summary)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Delivery Fee */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  🚚 ডেলিভারি চার্জ (৳)
                </label>
                <input
                  type="number"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="যেমন: ৭০ বা ১৩০"
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ঢাকার ভিতরে ৳৭০, বাইরে ৳১৩০
                </span>
              </div>

              {/* Advance Paid */}
              <div>
                <label className="block text-xs font-semibold text-emerald-300 mb-1">
                  💳 অগ্রিম প্রাপ্ত টাকা (Advance ৳)
                </label>
                <input
                  type="number"
                  value={advancePayment}
                  onChange={(e) => setAdvancePayment(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="বিকাশ / নগদ অগ্রিম..."
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  বিকাশ/নগদ/হাতে নেওয়া টাকা
                </span>
              </div>

              {/* COD Due Amount Highlight */}
              <div className="p-2.5 rounded-xl bg-slate-900 border-2 border-emerald-500/40 text-center flex flex-col justify-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  ক্যাশ অন ডেলিভারি (বাকি)
                </span>
                <span className="text-xl font-black font-mono text-emerald-300">
                  {formatBDT(dueAmount)}
                </span>
                <span className="text-[9px] text-slate-400">
                  মোট: {formatBDT(totalAmount)}
                </span>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                📝 বিশেষ নোট বা মন্তব্য (Optional Notes)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="যেমন: নারিকেল তেল ২ বোতল, ফ্রেশ ইনটেক ডেলিভারি..."
                className="w-full px-3 py-2 glass-input rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          {/* Footer Save Buttons */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
            >
              বাতিল
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer transition-all border border-emerald-300/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditing ? 'পরিবর্তন সেভ করুন' : 'প্রি-অর্ডার শিটে সেভ করুন (Save Pre-Order)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
