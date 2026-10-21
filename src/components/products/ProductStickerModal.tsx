import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Printer,
  Download,
  QrCode,
  Tag,
  Scissors,
  Layers,
  Sparkles,
  CheckCircle2,
  Phone,
  MapPin,
  Eye,
  Sliders,
  FileText,
  Copy,
  ExternalLink,
} from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Product, BrandSettings } from '../../types';
import { formatBDT } from '../../services/dataService';

interface ProductStickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  brandSettings: BrandSettings;
  onOpenLiveCard?: (product: Product) => void;
  onSellProduct?: (product: Product) => void;
}

export type StickerFormat = 'garment-tag' | 'thermal-compact' | 'sheet-a4';

export const ProductStickerModal: React.FC<ProductStickerModalProps> = ({
  isOpen,
  onClose,
  product,
  brandSettings,
  onOpenLiveCard,
  onSellProduct,
}) => {
  if (!isOpen || !product) return null;

  // Format: 'garment-tag' (retail hanging tag), 'thermal-compact' (50x30mm adhesive), 'sheet-a4' (multi-print grid)
  const [format, setFormat] = useState<StickerFormat>('garment-tag');
  const [sellingPrice, setSellingPrice] = useState<number | ''>(
    product.defaultSellingPrice !== null && product.defaultSellingPrice !== undefined
      ? product.defaultSellingPrice
      : 1950
  );
  const [sheetCount, setSheetCount] = useState<number>(
    Math.min(24, Math.max(1, product.currentStock || 12))
  );
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const printableRef = useRef<HTMLDivElement>(null);

  // Generate full scan URL that loads live product card in app
  const scanUrl = `${window.location.origin}${window.location.pathname}?scan_product=${encodeURIComponent(
    product.productCode
  )}`;

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(scanUrl, {
      width: 400,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('QR code generation failed:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [scanUrl, product.productCode]);

  // Sync selling price if product changes
  useEffect(() => {
    if (product.defaultSellingPrice !== null && product.defaultSellingPrice !== undefined) {
      setSellingPrice(product.defaultSellingPrice);
    }
  }, [product]);

  // Actions
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!printableRef.current) return;
    try {
      setIsDownloadingImage(true);
      const canvas = await html2canvas(printableRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `nahar-tag-${product.productCode.toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error downloading sticker image:', err);
      alert('ইমেজ ডাউনলোড করতে সমস্যা হয়েছে। দয়া করে প্রিন্ট বাটন ব্যবহার করুন।');
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!printableRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(printableRef.current, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({
        orientation: format === 'sheet-a4' ? 'portrait' : 'portrait',
        unit: 'mm',
        format: format === 'sheet-a4' ? 'a4' : [60, 95],
      });

      if (format === 'sheet-a4') {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.addImage(imgData, 'JPEG', 10, 10, pageWidth - 20, 0);
      } else {
        const pageWidth = pdf.internal.pageSize.getWidth();
        pdf.addImage(imgData, 'JPEG', 5, 5, pageWidth - 10, 0);
      }

      pdf.save(`nahar-sticker-${product.productCode}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('PDF তৈরি করতে সমস্যা হয়েছে।');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(scanUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const productImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : '/src/assets/images/three_piece_royal_floral_1792247226094.jpg';

  const brandDisplayName = brandSettings.brandName || 'নাহার দর্জি বাড়ি';
  const brandDisplayAddress =
    brandSettings.address || 'দোকান নং ১২, ইসলামপুর মার্কেট, ঢাকা-১১০০';
  const brandDisplayPhone = brandSettings.phone || '+880 1354-234702';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel-elevated rounded-2xl shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col border border-white/20 text-slate-100 overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Tag className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  স্মার্ট প্রোডাক্ট স্টিকার ও QR কোড প্রিন্ট
                </h3>
                <span className="font-mono-numbers px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs">
                  {product.productCode}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                কাপড়ে লাগানোর স্মার্ট প্রাইস ট্যাগ, বারকোড/কিউআর স্টিকার ও লাইভ সেল ভেরিফিকেশন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Controls, Right Live Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
          {/* LEFT COLUMN: Controls & Print Customization (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Format Selection */}
            <div className="p-4 glass-card rounded-xl border border-white/10 space-y-3">
              <label className="block text-xs font-bold text-slate-200">
                স্টিকারের ফরম্যাট বাছাই করুন:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormat('garment-tag')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    format === 'garment-tag'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Tag className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                  <span className="text-[11px] font-bold block">স্মার্ট হ্যাংট্যাগ</span>
                  <span className="text-[9px] text-slate-400 block">বুটিক প্রাইস ট্যাগ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('thermal-compact')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    format === 'thermal-compact'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <QrCode className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                  <span className="text-[11px] font-bold block">থার্মাল স্টিকার</span>
                  <span className="text-[9px] text-slate-400 block">৫০x৩৫ মিমি রুল</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormat('sheet-a4')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    format === 'sheet-a4'
                      ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                      : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Layers className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                  <span className="text-[11px] font-bold block">A4 শিট প্রিন্ট</span>
                  <span className="text-[9px] text-slate-400 block">একসাথে অনেক</span>
                </button>
              </div>
            </div>

            {/* Price Override Input */}
            <div className="p-4 glass-card rounded-xl border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>স্টিকারে বিক্রয় মূল্য (Sell Price)</span>
                </label>
                <span className="text-[10px] text-slate-400">ট্যাগে প্রদর্শিত হবে</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ৳
                </span>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) =>
                    setSellingPrice(e.target.value === '' ? '' : Number(e.target.value))
                  }
                  placeholder="যেমন: ১৯৯০"
                  className="w-full pl-8 pr-3 py-2.5 glass-input rounded-xl text-sm font-bold text-emerald-300 font-mono-numbers focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>কেনা খরচ: {formatBDT(product.purchaseCost)}</span>
                {sellingPrice !== '' && Number(sellingPrice) > product.purchaseCost && (
                  <span className="text-emerald-400 font-semibold font-mono-numbers">
                    লাভ: +{formatBDT(Number(sellingPrice) - product.purchaseCost)}
                  </span>
                )}
              </div>
            </div>

            {/* A4 Sheet Count */}
            {format === 'sheet-a4' && (
              <div className="p-4 glass-card rounded-xl border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold text-slate-200">
                    A4 পেজে স্টিকার সংখ্যা (কপি):
                  </label>
                  <span className="font-mono-numbers text-emerald-400 font-bold">
                    {sheetCount} টি স্টিকার
                  </span>
                </div>
                <div className="flex gap-2">
                  {[6, 12, 18, 24].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setSheetCount(count)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-colors ${
                        sheetCount === count
                          ? 'bg-emerald-500/20 border-emerald-400 text-white'
                          : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      {count} টি
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSheetCount(product.currentStock || 1)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border border-emerald-400/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20"
                    title="পুরো স্টকের সমান প্রিন্ট"
                  >
                    স্টক ({product.currentStock})
                  </button>
                </div>
              </div>
            )}

            {/* QR Scan Simulation & Quick Sell Links */}
            <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-medium">মোবাইল স্ক্যান লিংক:</span>
                <button
                  onClick={handleCopyLink}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedLink ? 'কপি হয়েছে!' : 'লিংক কপি'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500 truncate font-mono bg-black/50 p-1.5 rounded border border-white/5">
                {scanUrl}
              </p>

              <div className="pt-1 flex gap-2">
                {onOpenLiveCard && (
                  <button
                    type="button"
                    onClick={() => onOpenLiveCard(product)}
                    className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>কার্ড প্রিভিউ দেখুন</span>
                  </button>
                )}

                {onSellProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      onSellProduct(product);
                      onClose();
                    }}
                    className="flex-1 py-1.5 px-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>তাৎক্ষণিক বিক্রি করুন</span>
                  </button>
                )}
              </div>
            </div>

            {/* Print & Download Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-300/40 transition-all"
              >
                <Printer className="w-4 h-4 stroke-[2.5]" />
                <span>🖨️ স্টিকার প্রিন্ট করুন (Print Now)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={isDownloadingImage}
                  className="py-2 px-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isDownloadingImage ? 'ডাউনলোড হচ্ছে...' : 'PNG ডাউনলোড'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isGeneratingPdf}
                  className="py-2 px-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span>{isGeneratingPdf ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Live Printable Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-white/10 overflow-hidden relative">
            <div className="w-full flex items-center justify-between pb-3 text-xs text-slate-400 border-b border-white/10 mb-3">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                <span>লাইভ প্রিন্ট প্রিভিউ (স্টিকার কাটিং গাইড)</span>
              </div>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-slate-300">
                {format === 'garment-tag'
                  ? 'হ্যাংট্যাগ মাপ: ২ x ৩.৫ ইঞ্চি'
                  : format === 'thermal-compact'
                  ? 'থার্মাল মাপ: ৫০ x ৩৫ মিমি'
                  : `A4 গ্রিড (${sheetCount} টি স্টিকার)`}
              </span>
            </div>

            {/* Scrollable container for preview */}
            <div className="w-full max-h-[58vh] overflow-y-auto flex items-center justify-center p-2">
              {/* PRINTABLE CONTAINER (Targeted by window.print and html2canvas) */}
              <div
                id="product-sticker-printable"
                ref={printableRef}
                className="bg-white text-slate-900 rounded-lg shadow-2xl transition-all"
                style={{
                  color: '#0f172a',
                  backgroundColor: '#ffffff',
                }}
              >
                {/* 1. GARMENT HANGING TAG FORMAT */}
                {format === 'garment-tag' && (
                  <div
                    className="w-[280px] p-4 bg-white border-2 border-slate-900 rounded-xl relative flex flex-col justify-between text-slate-900 font-sans"
                    style={{ minHeight: '430px' }}
                  >
                    {/* Punch Hole Marker */}
                    <div className="w-4 h-4 rounded-full border-2 border-dashed border-slate-400 mx-auto -mt-1 mb-2 bg-slate-50 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                    </div>

                    {/* Brand Header */}
                    <div className="text-center pb-2 border-b-2 border-slate-900">
                      <div className="flex items-center justify-center gap-1.5">
                        {brandSettings.logoUrl ? (
                          <img
                            src={brandSettings.logoUrl}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : null}
                        <h2 className="text-base font-black tracking-tight text-slate-900 leading-none">
                          {brandDisplayName}
                        </h2>
                      </div>
                      <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold mt-0.5">
                        প্রিমিয়াম থ্রি-পিস ও টেইলারিং
                      </p>
                      <p className="text-[8px] text-slate-500 leading-tight mt-0.5 truncate px-1">
                        {brandDisplayAddress}
                      </p>
                    </div>

                    {/* Dress Mini Image & Specs */}
                    <div className="py-2.5 flex items-center gap-2.5 border-b border-dashed border-slate-300">
                      <div className="w-16 h-20 rounded-lg overflow-hidden border border-slate-300 bg-slate-100 shrink-0">
                        <img
                          src={productImage}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <span className="inline-block px-1.5 py-0.5 bg-slate-900 text-white font-mono font-bold text-[11px] rounded tracking-wide">
                          {product.productCode}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-tight">
                          {product.name}
                        </h4>
                        <p className="text-[9px] text-slate-600 font-medium truncate">
                          {product.category}
                        </p>
                        <p className="text-[9px] text-slate-500 font-medium">
                          রং: {product.color} · {product.size}
                        </p>
                      </div>
                    </div>

                    {/* QR Code & Mobile Scan Info */}
                    <div className="py-2 flex items-center justify-between gap-2 border-b border-slate-900">
                      <div className="flex-1 space-y-0.5">
                        <span className="text-[9px] font-bold text-slate-800 uppercase tracking-wider block">
                          লাইভ স্ক্যান কিউআর
                        </span>
                        <p className="text-[8px] text-slate-500 leading-tight">
                          ক্যামেরা দিয়ে স্ক্যান করলেই লাইভ ছবি, বিবরণ ও শপের ঠিকানা আসবে।
                        </p>
                        <p className="text-[8px] font-bold text-slate-700 font-mono">
                          {brandDisplayPhone}
                        </p>
                      </div>

                      <div className="w-18 h-18 bg-white p-1 rounded-md border border-slate-300 shrink-0 flex items-center justify-center">
                        {qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt="Product QR"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-100 animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Selling Price / MRP Banner */}
                    <div className="pt-2 text-center">
                      <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                        সর্বোচ্চ খুচরা বিক্রয় মূল্য (MRP)
                      </div>
                      <div className="text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                        {sellingPrice !== '' ? formatBDT(Number(sellingPrice)) : 'দাম নির্ধারিত নেই'}
                      </div>
                      <div className="text-[8px] text-slate-400 mt-0.5">
                        সব ট্যাক্স ও ভ্যাট অন্তর্ভুক্ত · নাহার দর্জি বাড়ি
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. THERMAL COMPACT STICKER FORMAT (50x35mm) */}
                {format === 'thermal-compact' && (
                  <div className="w-[260px] p-2.5 bg-white border border-slate-800 rounded-md flex flex-col justify-between text-slate-900">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <div className="min-w-0">
                        <span className="text-[11px] font-black text-slate-900 truncate block">
                          {brandDisplayName}
                        </span>
                        <span className="text-[8px] text-slate-500 truncate block">
                          {brandDisplayPhone}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded">
                        {product.productCode}
                      </span>
                    </div>

                    <div className="py-2 flex items-center gap-2">
                      <div className="w-11 h-11 bg-white border border-slate-300 rounded shrink-0 p-0.5">
                        {qrDataUrl && (
                          <img
                            src={qrDataUrl}
                            alt="QR"
                            className="w-full h-full object-contain"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold text-slate-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-[8px] text-slate-600 truncate">
                          {product.color} · {product.size}
                        </div>
                        <div className="text-[12px] font-black font-mono text-slate-900 mt-0.5">
                          বিক্রয়: {sellingPrice !== '' ? formatBDT(Number(sellingPrice)) : '-'}
                        </div>
                      </div>
                    </div>

                    <div className="text-[7px] text-slate-500 border-t border-slate-200 pt-0.5 flex justify-between">
                      <span>স্ক্যান করে বিস্তারিত দেখুন</span>
                      <span>নাহার দর্জি বাড়ি</span>
                    </div>
                  </div>
                )}

                {/* 3. A4 MULTI-STICKER SHEET FORMAT */}
                {format === 'sheet-a4' && (
                  <div className="w-[500px] p-5 bg-white text-slate-900">
                    <div className="text-center pb-3 border-b-2 border-slate-900 mb-3">
                      <h3 className="text-sm font-black text-slate-900">{brandDisplayName}</h3>
                      <p className="text-[9px] text-slate-600">
                        স্মার্ট বারকোড ও কিউআর লেবেল শিট · কোড: {product.productCode} · কপি: {sheetCount} টি
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      {Array.from({ length: sheetCount }).map((_, i) => (
                        <div
                          key={i}
                          className="p-2 border border-dashed border-slate-400 rounded-md flex items-center justify-between gap-1.5 bg-white"
                        >
                          <div className="w-12 h-12 border border-slate-300 rounded bg-white p-0.5 shrink-0">
                            {qrDataUrl && (
                              <img
                                src={qrDataUrl}
                                alt="QR"
                                className="w-full h-full object-contain"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 leading-tight">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-[10px] text-slate-900">
                                {product.productCode}
                              </span>
                              <span className="text-[8px] text-slate-500 font-bold truncate">
                                নাহার দর্জি বাড়ি
                              </span>
                            </div>
                            <div className="text-[9px] font-semibold text-slate-800 truncate">
                              {product.name}
                            </div>
                            <div className="text-[8px] text-slate-500 truncate">
                              {product.color} · {product.size}
                            </div>
                            <div className="text-[11px] font-black text-slate-900 font-mono mt-0.5">
                              {sellingPrice !== '' ? formatBDT(Number(sellingPrice)) : '-'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[10px] text-slate-400 mt-2 text-center">
              💡 প্রিন্ট দিলে শুধু স্টিকার প্রিন্টারে বের হবে — কোনো মেনু বা ব্যাকগ্রাউন্ড প্রিন্ট হবে না।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
