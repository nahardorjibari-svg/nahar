import React, { useState } from 'react';
import {
  X,
  ShoppingBag,
  Printer,
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  Sparkles,
  Tag,
  Layers,
  Share2,
  Copy,
  Boxes,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Product, BrandSettings } from '../../types';
import { formatBDT } from '../../services/dataService';

interface ProductScanCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  brandSettings: BrandSettings;
  onSellProduct?: (product: Product) => void;
  onPrintSticker?: (product: Product) => void;
}

export const ProductScanCardModal: React.FC<ProductScanCardModalProps> = ({
  isOpen,
  onClose,
  product,
  brandSettings,
  onSellProduct,
  onPrintSticker,
}) => {
  if (!isOpen || !product) return null;

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copiedLink, setCopiedLink] = useState(false);

  const brandDisplayName = brandSettings.brandName || 'নাহার দর্জি বাড়ি';
  const brandDisplayAddress =
    brandSettings.address || 'দোকান নং ১২, ইসলামপুর মার্কেট, ঢাকা-১১০০';
  const brandDisplayPhone = brandSettings.phone || '+880 1354-234702';

  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : ['/src/assets/images/three_piece_royal_floral_1792247226094.jpg'];

  const sellingPrice =
    product.defaultSellingPrice !== null && product.defaultSellingPrice !== undefined
      ? product.defaultSellingPrice
      : 1950;

  const isOutOfStock = product.currentStock === 0;
  const isLowStock = product.currentStock <= product.lowStockThreshold && product.currentStock > 0;

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${product.name} - ${brandDisplayName}`,
        text: `নাহার দর্জি বাড়ি থেকে ${product.name} (কোড: ${product.productCode}) - মূল্য: ${formatBDT(
          sellingPrice
        )}`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel-elevated rounded-2xl shadow-2xl max-w-xl w-full max-h-[94vh] flex flex-col border border-white/20 text-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Top Header with Boutique Branding */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 border border-white/20 shrink-0 flex items-center justify-center p-0.5">
              {brandSettings.logoUrl ? (
                <img
                  src={brandSettings.logoUrl}
                  alt={brandDisplayName}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="font-black text-emerald-400 text-sm">ন</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-white text-base leading-none">
                  {brandDisplayName}
                </h3>
                <span className="inline-flex items-center gap-0.5 text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full border border-emerald-500/40">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>ভেরিফাইড ট্যাগ</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                <span className="truncate max-w-xs">{brandDisplayAddress}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleShare}
              className="p-2 text-slate-400 hover:text-white glass-card rounded-xl transition-colors cursor-pointer"
              title="শেয়ার বা লিংক কপি করুন"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Main Product Image Carousel */}
          <div className="space-y-2">
            <div className="w-full aspect-4/3 rounded-2xl overflow-hidden bg-black/40 border border-white/15 relative shadow-lg">
              <img
                src={productImages[activeImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />

              {/* Floating Code Badge */}
              <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-3 py-1 rounded-xl border border-white/20 text-emerald-300 font-mono-numbers font-bold text-xs tracking-wider shadow-md">
                কোড: {product.productCode}
              </div>

              {/* Stock Indicator Badge */}
              <div className="absolute top-3 right-3">
                {isOutOfStock ? (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-rose-500/80 text-white backdrop-blur-md border border-rose-400/40 shadow">
                    স্টক শেষ (Out of Stock)
                  </span>
                ) : isLowStock ? (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-500/80 text-slate-950 backdrop-blur-md border border-amber-300/40 shadow">
                    সীমিত স্টক ({product.currentStock} পিস)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/80 text-slate-950 backdrop-blur-md border border-emerald-300/40 shadow flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>স্টকে আছে ({product.currentStock} পিস)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnails if multiple images */}
            {productImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                      activeImageIndex === idx
                        ? 'border-emerald-400 scale-95 shadow-[0_0_10px_rgba(16,185,129,0.5)]'
                        : 'border-white/20 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pricing Highlight Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/10 border border-emerald-400/30 flex items-center justify-between shadow-[0_4px_20px_rgba(16,185,129,0.15)]">
            <div>
              <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                সর্বোচ্চ বিক্রয় মূল্য (MRP)
              </span>
              <div className="text-2xl sm:text-3xl font-black text-white font-mono-numbers tracking-tight mt-0.5">
                {formatBDT(sellingPrice)}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">ইনভয়েস বা ক্যাশ সেল</span>
              <span className="text-xs text-emerald-400 font-semibold">১০০% অথেনটিক থ্রি-পিস</span>
            </div>
          </div>

          {/* Product Specifications */}
          <div className="glass-card rounded-2xl p-4 border border-white/10 space-y-3">
            <div>
              <h2 className="text-lg font-bold text-white leading-snug">{product.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{product.category}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-black/30 border border-white/10 rounded-xl">
                <span className="text-[10px] text-slate-400 block">রং (Color):</span>
                <span className="font-bold text-white mt-0.5 block">{product.color}</span>
              </div>

              <div className="p-2.5 bg-black/30 border border-white/10 rounded-xl">
                <span className="text-[10px] text-slate-400 block">সাইজ / টাইপ:</span>
                <span className="font-bold text-white mt-0.5 block">{product.size}</span>
              </div>
            </div>

            {product.notes && (
              <div className="p-3 bg-black/40 border border-white/10 rounded-xl text-xs text-slate-300 leading-relaxed">
                <strong className="text-white block mb-0.5">কাপড় ও টেইলারিং বিবরণ:</strong>
                {product.notes}
              </div>
            )}
          </div>

          {/* Direct Shop Helpline Info */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-400" />
              <div>
                <span className="text-[10px] text-slate-400 block">দোকান যোগাযোগ / অর্ডার</span>
                <span className="font-bold text-white font-mono-numbers">{brandDisplayPhone}</span>
              </div>
            </div>

            <a
              href={`https://wa.me/${brandDisplayPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                `আসসালামু আলাইকুম, আমি নাহার দর্জি বাড়ি থেকে "${product.name}" (কোড: ${product.productCode}) সম্পর্কে জানতে চাই।`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp চ্যাট</span>
            </a>
          </div>
        </div>

        {/* Modal Bottom Sticky Actions for Store Staff & Live Selling */}
        <div className="p-4 border-t border-white/10 bg-black/60 backdrop-blur-md flex flex-wrap items-center gap-2.5 shrink-0">
          {onSellProduct && (
            <button
              onClick={() => {
                onSellProduct(product);
                onClose();
              }}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-300/40 transition-all"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>⚡ সরাসরি বিক্রি করুন (Sell Item Now)</span>
            </button>
          )}

          {onPrintSticker && (
            <button
              onClick={() => {
                onPrintSticker(product);
                onClose();
              }}
              className="py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold rounded-xl text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>স্টিকার প্রিন্ট</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
