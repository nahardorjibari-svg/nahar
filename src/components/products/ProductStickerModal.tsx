import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Edit3,
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

export type StickerFormat = 'sheet-a4' | 'garment-tag' | 'thermal-compact';

export const ProductStickerModal: React.FC<ProductStickerModalProps> = ({
  isOpen,
  onClose,
  product,
  brandSettings,
  onOpenLiveCard,
  onSellProduct,
}) => {
  if (!isOpen || !product) return null;

  // Format: default to 'sheet-a4' as requested for A4 printers (HP LaserJet, etc.)
  const [format, setFormat] = useState<StickerFormat>('sheet-a4');
  const [sellingPrice, setSellingPrice] = useState<number | ''>(
    product.defaultSellingPrice !== null && product.defaultSellingPrice !== undefined
      ? product.defaultSellingPrice
      : 1950
  );

  // Preset & Custom count: 2, 6, 12, 18, 24, stock, or custom
  const stockCount = Math.max(1, product.currentStock || 2);
  const [sheetCount, setSheetCount] = useState<number>(
    product.currentStock && product.currentStock > 0 ? product.currentStock : 2
  );
  const [customCountInput, setCustomCountInput] = useState<string>('');

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
        dark: '#000000',
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

  // Manage print class on body
  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-stickers-active');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      document.body.classList.remove('printing-stickers-active');
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Print Action: targets the portal directly at top of A4 page
  const handlePrint = () => {
    document.body.classList.add('printing-stickers-active');
    setTimeout(() => {
      window.print();
    }, 60);
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
      link.download = `nahar-sticker-a4-${product.productCode.toLowerCase()}.png`;
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
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      // Render from top margin of 8mm
      const imgWidth = pageWidth - 16;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 8, 8, imgWidth, imgHeight);

      pdf.save(`nahar-stickers-a4-${product.productCode}.pdf`);
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
    brandSettings.address || 'Raj place, Rishipara, Padma mor, Hemayetpur, Dhaka';
  const brandDisplayPhone = brandSettings.phone || '+880 1354-234702';

  // Helper to change count from preset buttons
  const handleSelectPreset = (count: number) => {
    setSheetCount(count);
    setCustomCountInput('');
  };

  // Helper to handle custom input typing
  const handleCustomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomCountInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSheetCount(Math.min(100, Math.max(1, parsed)));
    }
  };

  // Sticker Grid Column Layout based on count
  const getGridColsClass = () => {
    if (sheetCount <= 2) return 'grid-cols-2';
    if (sheetCount <= 8) return 'grid-cols-2';
    if (sheetCount <= 18) return 'grid-cols-3';
    return 'grid-cols-3 sm:grid-cols-4';
  };

  // Reusable Single Sticker Component designed for High-Contrast Black & White & Color printing
  const renderStickerItem = (index: number) => {
    const isTwoLayout = sheetCount <= 2;
    const isMediumLayout = sheetCount > 2 && sheetCount <= 8;

    return (
      <div
        key={index}
        className="sticker-print-card relative bg-white text-black border-2 border-dashed border-slate-900 rounded-lg p-2.5 flex flex-col justify-between overflow-hidden"
        style={{
          boxSizing: 'border-box',
          pageBreakInside: 'avoid',
          breakInside: 'avoid',
          minHeight: isTwoLayout ? '160px' : isMediumLayout ? '135px' : '115px',
        }}
      >
        {/* Scissor cutting icon marker */}
        <div className="absolute top-1 right-1 text-[8px] font-mono text-slate-500 flex items-center gap-0.5 print:text-black">
          <Scissors className="w-2.5 h-2.5" />
          <span>কাটুন</span>
        </div>

        {/* 1. Header: Brand Info */}
        <div className="border-b border-slate-800 pb-1 mb-1.5 pr-10">
          <div className="flex items-center gap-1.5">
            {brandSettings.logoUrl ? (
              <img
                src={brandSettings.logoUrl}
                alt=""
                className="w-4 h-4 rounded-full object-cover border border-slate-800 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-4 h-4 rounded-full bg-slate-900 text-white text-[8px] font-black flex items-center justify-center shrink-0">
                ন
              </div>
            )}
            <h4 className="font-black text-slate-900 text-[11px] leading-tight truncate tracking-tight">
              {brandDisplayName}
            </h4>
          </div>
          <div className="flex items-center justify-between text-[7.5px] text-slate-700 mt-0.5 font-medium leading-none">
            <span className="truncate max-w-[150px]">{brandDisplayAddress}</span>
            <span className="font-mono text-slate-900 font-bold ml-1">{brandDisplayPhone}</span>
          </div>
        </div>

        {/* 2. Middle Row: Thumbnail Image + Details + QR Code */}
        <div className="flex items-center gap-2 flex-1 my-0.5">
          {/* Dress Thumbnail Image */}
          <div
            className={`border border-slate-800 rounded bg-slate-50 overflow-hidden shrink-0 ${
              isTwoLayout ? 'w-14 h-16' : isMediumLayout ? 'w-12 h-14' : 'w-10 h-12'
            }`}
          >
            <img
              src={productImage}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Product Specs */}
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="font-mono font-black text-[9.5px] bg-slate-900 text-white px-1 py-0.2 rounded leading-tight print:border print:border-black">
                {product.productCode}
              </span>
              <span className="text-[7.5px] font-bold text-slate-600 truncate">
                {product.category}
              </span>
            </div>

            <h5 className="font-bold text-[9px] text-slate-950 truncate leading-tight mt-0.5">
              {product.name}
            </h5>

            <p className="text-[7.5px] text-slate-700 font-medium truncate">
              রং: {product.color} · সাইজ: {product.size}
            </p>

            {isTwoLayout && (
              <p className="text-[7px] text-slate-500 truncate">
                কটন লন / প্রিমিয়াম ড্রেস
              </p>
            )}
          </div>

          {/* QR Code for Mobile Scanning */}
          <div className="flex flex-col items-center shrink-0">
            <div
              className={`p-0.5 border border-slate-800 rounded bg-white shrink-0 flex items-center justify-center ${
                isTwoLayout ? 'w-14 h-14' : isMediumLayout ? 'w-12 h-12' : 'w-10 h-10'
              }`}
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-slate-200 animate-pulse" />
              )}
            </div>
            <span className="text-[6.5px] text-slate-600 font-bold uppercase tracking-tighter mt-0.5 leading-none">
              লাইভ স্ক্যান
            </span>
          </div>
        </div>

        {/* 3. Bottom Row: MRP Selling Price in Large High-Visibility Text */}
        <div className="border-t border-slate-800 pt-1 mt-1 flex items-center justify-between">
          <div className="text-[7px] font-bold uppercase tracking-wider text-slate-600">
            বিক্রয় মূল্য (MRP):
          </div>
          <div className="text-[13px] font-black text-slate-950 font-mono tracking-tight leading-none">
            {sellingPrice !== '' ? formatBDT(Number(sellingPrice)) : 'দাম নির্ধারিত নেই'}
          </div>
        </div>
      </div>
    );
  };

  // A4 Printable Sheet Content (Used both in Preview and in Print Portal)
  const renderA4SheetContent = () => (
    <div className="w-full max-w-[194mm] mx-auto bg-white text-slate-900 font-sans p-1">
      {/* Top Header of the Printable Sheet (Starts right at the top) */}
      <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5 mb-2 text-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="font-black text-[12px]">{brandDisplayName}</span>
          <span className="text-[9px] text-slate-600 font-bold">
            · স্মার্ট প্রোডাক্ট স্টিকার শিট
          </span>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-slate-700">
          <span>কোড: {product.productCode}</span>
          <span>·</span>
          <span>কপি সংখ্যা: {sheetCount} টি</span>
          <span>·</span>
          <span className="bg-slate-100 px-1 py-0.5 rounded border border-slate-300">A4 সাইজ</span>
        </div>
      </div>

      {/* Grid of Stickers */}
      <div className={`grid gap-2.5 ${getGridColsClass()}`}>
        {Array.from({ length: sheetCount }).map((_, i) => renderStickerItem(i))}
      </div>

      {/* Paper reuse helper guide if few stickers are printed */}
      {sheetCount <= 6 && (
        <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-center text-[8px] text-slate-400 print:text-slate-500 font-mono">
          ✂️ এখান থেকে কেটে নিন — নিচের খালি পেজটি পরবর্তীতে অন্য প্রিন্টে ব্যবহার করা যাবে।
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 1. SCREEN MODAL DIALOG */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
        <div className="glass-panel-elevated rounded-2xl shadow-2xl max-w-5xl w-full max-h-[94vh] flex flex-col border border-white/20 text-slate-100 overflow-hidden">
          {/* Modal Header */}
          <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
                <Tag className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-base">
                    স্মার্ট প্রোডাক্ট স্টিকার ও QR কোড প্রিন্ট (A4 পেজ সেটআপ)
                  </h3>
                  <span className="font-mono-numbers px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs">
                    {product.productCode}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  HP LaserJet ও সাধারণ A4 প্রিন্টারে কোনো ফাঁকা না রেখে একদম উপর থেকে সঠিক সাইজে প্রিন্ট
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

          {/* Modal Body: Left Controls (5 cols), Right Live Preview (7 cols) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-5">
            {/* LEFT COLUMN: Controls & Count Preset Buttons */}
            <div className="lg:col-span-5 space-y-4">
              {/* Format Selection */}
              <div className="p-3.5 glass-card rounded-xl border border-white/10 space-y-2.5">
                <label className="block text-xs font-bold text-slate-200">
                  প্রিন্ট ফরম্যাট বাছাই করুন:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormat('sheet-a4')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      format === 'sheet-a4'
                        ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Layers className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <span className="text-[11px] font-bold block">A4 পেজ শিট</span>
                    <span className="text-[9px] text-emerald-300 block font-medium">HP / লেজার জেট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('garment-tag')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      format === 'garment-tag'
                        ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Tag className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                    <span className="text-[11px] font-bold block">স্মার্ট হ্যাংট্যাগ</span>
                    <span className="text-[9px] text-slate-400 block">১টি সিঙ্গেল ট্যাগ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('thermal-compact')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      format === 'thermal-compact'
                        ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    <span className="text-[11px] font-bold block">থার্মাল লেবেল</span>
                    <span className="text-[9px] text-slate-400 block">৫০x৩৫ মিমি</span>
                  </button>
                </div>
              </div>

              {/* Selling Price (বিক্রয় মূল্য / MRP) */}
              <div className="p-3.5 glass-card rounded-xl border border-white/10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    <span>স্টিকারে বিক্রয় মূল্য (Sell Price / MRP):</span>
                  </label>
                  <span className="text-[10px] text-slate-400">ট্যাগে বোল্ড থাকবে</span>
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
                    placeholder="যেমন: ১৯৫০"
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

              {/* A4 পেজে স্টিকার সংখ্যা (কপি) — EXACT PRESETS & CUSTOM INPUT */}
              <div className="p-4 glass-card rounded-xl border border-white/10 space-y-3 bg-emerald-500/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>A4 পেজে স্টিকার সংখ্যা (কপি):</span>
                  </label>
                  <span className="font-mono-numbers px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40">
                    {sheetCount} টি স্টিকার
                  </span>
                </div>

                {/* Preset Buttons: 2, 6, 12, 18, 24, স্টক (২) */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {[2, 6, 12, 18, 24].map((count) => {
                    const isSelected = sheetCount === count && customCountInput === '';
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => handleSelectPreset(count)}
                        className={`py-2 px-1 rounded-lg text-xs font-bold cursor-pointer border text-center transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-300 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                            : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {count} টি
                      </button>
                    );
                  })}

                  {/* Stock count button */}
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(stockCount)}
                    className={`py-2 px-1 rounded-lg text-xs font-bold cursor-pointer border text-center transition-all ${
                      sheetCount === stockCount && customCountInput === ''
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-300 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                    title={`বর্তমান স্টক অনুসারে (${stockCount} টি)`}
                  >
                    স্টক ({stockCount})
                  </button>
                </div>

                {/* Custom count input: "ei castom daw icca moto leke print dite parbo" */}
                <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-300 font-semibold shrink-0">
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>কাস্টম সংখ্যা:</span>
                  </div>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={customCountInput !== '' ? customCountInput : sheetCount}
                      onChange={handleCustomCountChange}
                      placeholder="ইচ্ছামতো সংখ্যা লিখুন..."
                      className="w-full px-3 py-1.5 glass-input rounded-lg text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">টি কপি</span>
                </div>
              </div>

              {/* Mobile QR Scan & Fast POS Sale Links */}
              <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">মোবাইল ক্যামেরা স্ক্যান লিংক:</span>
                  <button
                    onClick={handleCopyLink}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedLink ? 'কপি হয়েছে!' : 'লিংক কপি'}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 truncate font-mono bg-black/50 p-1.5 rounded border border-white/5">
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
                      <span>লাইভ কার্ড দেখুন</span>
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

              {/* Main Print and Download Buttons */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-300 transition-all"
                >
                  <Printer className="w-5 h-5 stroke-[2.5]" />
                  <span>🖨️ A4 পেজে প্রিন্ট করুন (Print A4 Now)</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    disabled={isDownloadingImage}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isDownloadingImage ? 'ডাউনলোড হচ্ছে...' : 'PNG ডাউনলোড'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={isGeneratingPdf}
                    className="py-2.5 px-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-teal-400" />
                    <span>{isGeneratingPdf ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড (A4)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Live Printable Preview (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-start p-4 bg-slate-950/80 rounded-2xl border border-white/10 overflow-hidden relative">
              <div className="w-full flex items-center justify-between pb-2 text-xs text-slate-400 border-b border-white/10 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Scissors className="w-3.5 h-3.5 text-emerald-400" />
                  <span>A4 পেজ লাইভ প্রিভিউ (উপর থেকে সাজানো)</span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                  {format === 'sheet-a4'
                    ? `A4 শিট (${sheetCount} টি স্টিকার)`
                    : format === 'garment-tag'
                    ? 'সিঙ্গেল হ্যাংট্যাগ'
                    : 'থার্মাল লেবেল'}
                </span>
              </div>

              {/* Scrollable container for preview */}
              <div className="w-full max-h-[58vh] overflow-y-auto flex flex-col items-center justify-start p-1 bg-slate-900/60 rounded-xl border border-white/5">
                {/* Visual A4 paper frame */}
                <div
                  ref={printableRef}
                  className="w-full bg-white text-slate-900 rounded shadow-2xl p-3 my-1"
                  style={{
                    minHeight: '400px',
                    color: '#000000',
                    backgroundColor: '#ffffff',
                  }}
                >
                  {format === 'sheet-a4' ? (
                    renderA4SheetContent()
                  ) : format === 'garment-tag' ? (
                    <div className="max-w-[280px] mx-auto p-4 bg-white border-2 border-slate-900 rounded-xl relative flex flex-col justify-between text-slate-900">
                      {/* Punch Hole Marker */}
                      <div className="w-4 h-4 rounded-full border-2 border-dashed border-slate-400 mx-auto -mt-1 mb-2 bg-slate-50 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      </div>

                      {/* Brand Header */}
                      <div className="text-center pb-2 border-b-2 border-slate-900">
                        <h2 className="text-base font-black tracking-tight text-slate-900 leading-none">
                          {brandDisplayName}
                        </h2>
                        <p className="text-[9px] uppercase tracking-wider text-slate-600 font-bold mt-0.5">
                          প্রিমিয়াম থ্রি-পিস ও টেইলারিং
                        </p>
                        <p className="text-[8px] text-slate-500 leading-tight mt-0.5 truncate px-1">
                          {brandDisplayAddress} · {brandDisplayPhone}
                        </p>
                      </div>

                      {/* Mini Dress Image & Specs */}
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

                      {/* QR Code */}
                      <div className="py-2 flex items-center justify-between gap-2 border-b border-slate-900">
                        <div className="flex-1 space-y-0.5">
                          <span className="text-[9px] font-bold text-slate-800 uppercase tracking-wider block">
                            লাইভ স্ক্যান কিউআর
                          </span>
                          <p className="text-[8px] text-slate-500 leading-tight">
                            স্ক্যান করলেই লাইভ ছবি, বিবরণ ও শপের ঠিকানা আসবে।
                          </p>
                        </div>
                        <div className="w-16 h-16 bg-white p-1 rounded-md border border-slate-300 shrink-0 flex items-center justify-center">
                          {qrDataUrl && (
                            <img
                              src={qrDataUrl}
                              alt="Product QR"
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="pt-2 text-center">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                          সর্বোচ্চ খুচরা বিক্রয় মূল্য (MRP)
                        </div>
                        <div className="text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                          {sellingPrice !== '' ? formatBDT(Number(sellingPrice)) : 'দাম নির্ধারিত নেই'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Thermal compact */
                    <div className="max-w-[260px] mx-auto p-2.5 bg-white border border-slate-800 rounded-md flex flex-col justify-between text-slate-900">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <div>
                          <span className="text-[11px] font-black text-slate-900 block">
                            {brandDisplayName}
                          </span>
                          <span className="text-[8px] text-slate-500 block">
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
                            <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
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
                            {sellingPrice !== '' ? formatBDT(Number(sellingPrice)) : '-'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Note below preview */}
              <div className="w-full mt-2.5 px-2 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                <p className="text-[11px] text-emerald-300 font-medium">
                  ✨ <strong>A4 পেজের একদম উপর থেকে প্রিন্ট হবে</strong> — উপরে কোনো খালি জায়গা নষ্ট হবে না। প্রিন্ট দিয়ে কাঁচি দিয়ে সহজে কেটে প্রোডাক্টে লাগাতে পারবেন।
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED PRINT PORTAL (Mounted directly to document.body, positioned at top: 0 in @media print) */}
      {createPortal(
        <div id="product-sticker-print-portal" className="hidden print:block">
          {format === 'sheet-a4' ? (
            renderA4SheetContent()
          ) : (
            /* For single tag or thermal when printed to A4 paper, render neatly at top-left of the A4 page */
            <div className="w-full max-w-[194mm] mx-auto bg-white text-black p-2 font-sans">
              <div className="flex items-center justify-between border-b border-slate-400 pb-1 mb-3 text-[9px] text-slate-600 font-mono">
                <span>{brandDisplayName} · সিঙ্গেল লেবেল প্রিন্ট</span>
                <span>কোড: {product.productCode}</span>
              </div>
              <div className="flex items-start gap-4">
                <div className="border-2 border-slate-900 rounded p-3 w-[260px] bg-white">
                  {renderStickerItem(0)}
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-dashed border-slate-300 text-[8px] text-slate-400 font-mono">
                ✂️ কাটিং গাইড — কাঁচি দিয়ে কেটে পোশাকে লাগান।
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
