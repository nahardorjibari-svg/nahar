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
  Phone,
  Eye,
  Sliders,
  FileText,
  Copy,
  Edit3,
  CheckCircle,
  HelpCircle,
  Check,
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

export type StickerFormat = 'thermal-compact' | 'sheet-a4' | 'garment-tag';
export type ThermalSize = '50x30' | '50x35' | '40x30' | '58mm' | '80mm';

export const ProductStickerModal: React.FC<ProductStickerModalProps> = ({
  isOpen,
  onClose,
  product,
  brandSettings,
  onOpenLiveCard,
  onSellProduct,
}) => {
  if (!isOpen || !product) return null;

  // Format selection
  const [format, setFormat] = useState<StickerFormat>('thermal-compact');
  const [thermalSize, setThermalSize] = useState<ThermalSize>('50x30');

  // Selling Price
  const [sellingPrice, setSellingPrice] = useState<number | ''>(
    product.defaultSellingPrice !== null && product.defaultSellingPrice !== undefined
      ? product.defaultSellingPrice
      : 1950
  );

  // Stock count
  const stockCount = Math.max(1, product.currentStock || 2);

  // A4 sheet count & Thermal copies count
  const [sheetCount, setSheetCount] = useState<number>(
    product.currentStock && product.currentStock > 0 ? product.currentStock : 2
  );
  const [thermalCopies, setThermalCopies] = useState<number>(
    product.currentStock && product.currentStock > 0 ? product.currentStock : 1
  );
  const [customCountInput, setCustomCountInput] = useState<string>('');

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showThermalGuide, setShowThermalGuide] = useState(false);

  const printableRef = useRef<HTMLDivElement>(null);

  // Scan URL that opens the live product card inside app
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

  useEffect(() => {
    if (product.defaultSellingPrice !== null && product.defaultSellingPrice !== undefined) {
      setSellingPrice(product.defaultSellingPrice);
    }
  }, [product]);

  // Manage print class on body
  useEffect(() => {
    const handleAfterPrint = () => {
      document.body.classList.remove('printing-stickers-active');
      document.body.classList.remove('printing-thermal-active');
      document.body.classList.remove('printing-a4-active');
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      handleAfterPrint();
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // Print Action
  const handlePrint = () => {
    if (format === 'thermal-compact') {
      document.body.classList.add('printing-thermal-active');
    } else {
      document.body.classList.add('printing-a4-active');
    }
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
      link.download = `nahar-sticker-${format}-${product.productCode.toLowerCase()}.png`;
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

      if (format === 'thermal-compact') {
        const pdf = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: [50, 30],
        });
        pdf.addImage(imgData, 'JPEG', 1, 1, 48, 28);
        pdf.save(`nahar-thermal-${product.productCode}.pdf`);
      } else {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const imgWidth = pageWidth - 16;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'JPEG', 8, 8, imgWidth, imgHeight);
        pdf.save(`nahar-stickers-a4-${product.productCode}.pdf`);
      }
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

  // Handle Preset count click
  const handleSelectCount = (count: number) => {
    if (format === 'thermal-compact') {
      setThermalCopies(count);
    } else {
      setSheetCount(count);
    }
    setCustomCountInput('');
  };

  // Handle Custom count typing
  const handleCustomCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setCustomCountInput(raw);
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) {
      const clamped = Math.min(100, Math.max(1, parsed));
      if (format === 'thermal-compact') {
        setThermalCopies(clamped);
      } else {
        setSheetCount(clamped);
      }
    }
  };

  const activeCopies = format === 'thermal-compact' ? thermalCopies : sheetCount;

  // Grid layout for A4 sheet
  const getGridColsClass = () => {
    if (sheetCount <= 2) return 'grid-cols-2';
    if (sheetCount <= 8) return 'grid-cols-2';
    if (sheetCount <= 18) return 'grid-cols-3';
    return 'grid-cols-3 sm:grid-cols-4';
  };

  // 1. THERMAL STICKER COMPONENT (50x30mm, 50x35mm, 58mm, 80mm)
  const renderThermalSticker = (keyIndex: number = 0) => {
    return (
      <div
        key={keyIndex}
        className="thermal-sticker-page bg-white text-black border-2 border-black rounded-sm flex flex-col justify-between overflow-hidden"
        style={{
          width: thermalSize === '50x35' ? '188px' : thermalSize === '58mm' ? '210px' : thermalSize === '80mm' ? '290px' : '185px',
          height: thermalSize === '50x35' ? '132px' : thermalSize === '58mm' ? '140px' : thermalSize === '80mm' ? '170px' : '114px',
          padding: '3px 4px',
          boxSizing: 'border-box',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          pageBreakAfter: 'always',
          breakAfter: 'page',
        }}
      >
        {/* Thermal Header */}
        <div className="flex items-center justify-between border-b border-black pb-0.5 leading-none">
          <span className="font-black text-[10px] text-black tracking-tight truncate max-w-[115px]">
            {brandDisplayName}
          </span>
          <span className="font-mono font-black text-[9px] bg-black text-white px-1 py-0.2 rounded leading-tight">
            {product.productCode}
          </span>
        </div>

        {/* Middle Row: QR Code + Product Info */}
        <div className="flex items-center gap-1.5 my-0.5">
          {/* QR Code */}
          <div className="w-11 h-11 border border-black p-0.5 bg-white shrink-0 flex items-center justify-center">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full bg-slate-300 animate-pulse" />
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 space-y-0.2">
            <h5 className="font-bold text-[8.5px] text-black leading-tight line-clamp-1">
              {product.name}
            </h5>
            <p className="text-[7.5px] text-slate-800 leading-none truncate">
              {product.category} · {product.color}
            </p>
            <p className="text-[7.5px] text-slate-900 font-semibold leading-none">
              সাইজ: {product.size}
            </p>
            <div className="text-[12px] font-black text-black font-mono leading-none pt-0.5">
              {sellingPrice !== '' ? formatBDT(Number(sellingPrice)) : '-'}
            </div>
          </div>
        </div>

        {/* Thermal Footer */}
        <div className="border-t border-black pt-0.5 flex items-center justify-between text-[6.5px] text-black font-bold uppercase leading-none">
          <span>স্ক্যান করে লাইভ দেখুন</span>
          <span className="font-mono">{brandDisplayPhone}</span>
        </div>
      </div>
    );
  };

  // 2. A4 SHEET SINGLE STICKER COMPONENT
  const renderA4StickerItem = (index: number) => {
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

        {/* Brand Header */}
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

        {/* Middle Row: Image + Details + QR */}
        <div className="flex items-center gap-2 flex-1 my-0.5">
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
          </div>

          <div className="flex flex-col items-center shrink-0">
            <div
              className={`p-0.5 border border-slate-800 rounded bg-white shrink-0 flex items-center justify-center ${
                isTwoLayout ? 'w-14 h-14' : isMediumLayout ? 'w-12 h-12' : 'w-10 h-10'
              }`}
            >
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-200 animate-pulse" />
              )}
            </div>
            <span className="text-[6.5px] text-slate-600 font-bold uppercase tracking-tighter mt-0.5 leading-none">
              লাইভ স্ক্যান
            </span>
          </div>
        </div>

        {/* Price Row */}
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

  // A4 Printable Sheet Content
  const renderA4SheetContent = () => (
    <div className="w-full max-w-[194mm] mx-auto bg-white text-slate-900 font-sans p-1">
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
          <span>কপি: {sheetCount} টি</span>
          <span>·</span>
          <span className="bg-slate-100 px-1 py-0.5 rounded border border-slate-300">A4 সাইজ</span>
        </div>
      </div>

      <div className={`grid gap-2.5 ${getGridColsClass()}`}>
        {Array.from({ length: sheetCount }).map((_, i) => renderA4StickerItem(i))}
      </div>

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
          {/* Modal Header with IMMEDIATE PRINT BUTTON */}
          <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)] shrink-0">
                <Printer className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm sm:text-base truncate">
                    {format === 'thermal-compact'
                      ? '🖨️ থার্মাল প্রিন্টার স্টিকার প্রিন্ট'
                      : '📄 A4 পেজ স্টিকার প্রিন্ট'}
                  </h3>
                  <span className="font-mono-numbers px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-xs shrink-0">
                    {product.productCode}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {format === 'thermal-compact'
                    ? 'Xprinter, Zebra বা ৫০x৩০মিমি থার্মাল রোলে সরাসরি প্রিন্ট'
                    : 'HP LaserJet ও সাধারণ A4 প্রিন্টারে সঠিক মার্জিনে প্রিন্ট'}
                </p>
              </div>
            </div>

            {/* HEADER FAST ACTION BUTTONS */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePrint}
                className="py-2 px-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-300/40 transition-all"
                title="সরাসরি প্রিন্ট ডায়ালগ খুলুন"
              >
                <Printer className="w-4 h-4 stroke-[2.5]" />
                <span className="font-bold">প্রিন্ট করুন</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body: Left Controls, Right Preview */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-5 p-4 sm:p-5">
            {/* LEFT COLUMN: Controls */}
            <div className="lg:col-span-5 space-y-4">
              {/* Format Switcher */}
              <div className="p-3 glass-card rounded-xl border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200">
                    প্রিন্টারের ধরন (Printer Type):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowThermalGuide(!showThermalGuide)}
                    className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer font-semibold"
                  >
                    <HelpCircle className="w-3 h-3" />
                    <span>থার্মাল প্রিন্টার নিয়ম</span>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setFormat('thermal-compact')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      format === 'thermal-compact'
                        ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                    <span className="text-[11px] font-black block text-emerald-300">
                      🖨️ থার্মাল প্রিন্টার
                    </span>
                    <span className="text-[9px] text-slate-300 block">৫০x৩০মিমি রোল</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('sheet-a4')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      format === 'sheet-a4'
                        ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Layers className="w-4 h-4 mx-auto mb-1 text-teal-400" />
                    <span className="text-[11px] font-bold block">A4 পেজ শিট</span>
                    <span className="text-[9px] text-slate-400 block">HP / সাধারণ প্রিন্টার</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormat('garment-tag')}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      format === 'garment-tag'
                        ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/20 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] ring-1 ring-emerald-400'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Tag className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                    <span className="text-[11px] font-bold block">স্মার্ট হ্যাংট্যাগ</span>
                    <span className="text-[9px] text-slate-400 block">১টি ট্যাগ</span>
                  </button>
                </div>
              </div>

              {/* Thermal Label Size Selection (When Thermal is Active) */}
              {format === 'thermal-compact' && (
                <div className="p-3 glass-card rounded-xl border border-white/10 space-y-2 bg-emerald-500/5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-200">লেবেল পেপার সাইজ:</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      {thermalSize === '50x30'
                        ? '৫০ x ৩০ মিমি (স্ট্যান্ডার্ড)'
                        : thermalSize === '50x35'
                        ? '৫০ x ৩৫ মিমি'
                        : thermalSize === '40x30'
                        ? '৪০ x ৩০ মিমি'
                        : thermalSize === '58mm'
                        ? '৫৮ মিমি রোল'
                        : '৮০ মিমি রোল'}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: '50x30', label: '৫০x৩০ মিমি' },
                      { id: '50x35', label: '৫০x৩৫ মিমি' },
                      { id: '58mm', label: '৫৮ মিমি রোল' },
                      { id: '80mm', label: '৮০ মিমি রোল' },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        type="button"
                        onClick={() => setThermalSize(sz.id as ThermalSize)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold cursor-pointer border text-center transition-all ${
                          thermalSize === sz.id
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                            : 'bg-black/40 border-white/10 text-slate-300 hover:text-white'
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Thermal Print Step-by-Step Guide Modal/Box */}
              {showThermalGuide && (
                <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-xl space-y-2 text-xs text-amber-200 animate-in fade-in">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span>থার্মাল প্রিন্টারে প্রিন্ট করার ৩টি সহজ ধাপ:</span>
                    </span>
                    <button
                      onClick={() => setShowThermalGuide(false)}
                      className="text-amber-400 hover:text-amber-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-200">
                    <li>
                      নিচের <strong>'🖨️ থার্মাল প্রিন্টারে প্রিন্ট করুন'</strong> বাটনে চাপ দিন।
                    </li>
                    <li>
                      কম্পিউটারের প্রিন্ট উইন্ডোতে <strong>Destination</strong> থেকে আপনার থার্মাল
                      প্রিন্টার (যেমন: <em>Xprinter, Zebra, POS-58</em>) সিলেক্ট করুন।
                    </li>
                    <li>
                      <strong>Paper size</strong>-এ <strong>50x30mm</strong> বা <strong>Roll</strong>{' '}
                      সিলেক্ট করে <strong>Print</strong> দিন। প্রতিটি স্টিকার স্বয়ংক্রিয়ভাবে আলাদা হয়ে
                      বের হবে!
                    </li>
                  </ol>
                </div>
              )}

              {/* Selling Price / MRP */}
              <div className="p-3 glass-card rounded-xl border border-white/10 space-y-2">
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
                    className="w-full pl-8 pr-3 py-2 glass-input rounded-xl text-sm font-bold text-emerald-300 font-mono-numbers focus:outline-none focus:ring-1 focus:ring-emerald-400"
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

              {/* Copies Selection: Works for both Thermal and A4 */}
              <div className="p-3.5 glass-card rounded-xl border border-white/10 space-y-2.5 bg-emerald-500/5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>
                      {format === 'thermal-compact'
                        ? 'থার্মাল রোলে স্টিকার সংখ্যা (কপি):'
                        : 'A4 পেজে স্টিকার সংখ্যা (কপি):'}
                    </span>
                  </label>
                  <span className="font-mono-numbers px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/40">
                    {activeCopies} টি কপি
                  </span>
                </div>

                {/* Preset Buttons */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {(format === 'thermal-compact'
                    ? [1, 2, 5, 10, 20]
                    : [2, 6, 12, 18, 24]
                  ).map((count) => {
                    const isSelected = activeCopies === count && customCountInput === '';
                    return (
                      <button
                        key={count}
                        type="button"
                        onClick={() => handleSelectCount(count)}
                        className={`py-1.5 px-1 rounded-lg text-xs font-bold cursor-pointer border text-center transition-all ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-300 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                            : 'bg-black/40 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {count} টি
                      </button>
                    );
                  })}

                  {/* Stock button */}
                  <button
                    type="button"
                    onClick={() => handleSelectCount(stockCount)}
                    className={`py-1.5 px-1 rounded-lg text-xs font-bold cursor-pointer border text-center transition-all ${
                      activeCopies === stockCount && customCountInput === ''
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-300 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                        : 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                    title={`বর্তমান স্টক অনুসারে (${stockCount} টি)`}
                  >
                    স্টক ({stockCount})
                  </button>
                </div>

                {/* Custom count input */}
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
                      value={customCountInput !== '' ? customCountInput : activeCopies}
                      onChange={handleCustomCountChange}
                      placeholder="ইচ্ছামতো সংখ্যা লিখুন..."
                      className="w-full px-3 py-1.5 glass-input rounded-lg text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium shrink-0">টি কপি</span>
                </div>
              </div>

              {/* PRIMARY ACTION PRINT BUTTON */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-sm flex flex-col items-center justify-center gap-1 cursor-pointer shadow-[0_0_25px_rgba(16,185,129,0.5)] border border-emerald-300 transition-all"
                >
                  <div className="flex items-center gap-2 text-base">
                    <Printer className="w-5 h-5 stroke-[2.5]" />
                    <span>
                      {format === 'thermal-compact'
                        ? '🖨️ থার্মাল প্রিন্টারে প্রিন্ট করুন (Print Thermal Now)'
                        : format === 'sheet-a4'
                        ? '🖨️ A4 পেজে প্রিন্ট করুন (Print A4 Now)'
                        : '🖨️ হ্যাংট্যাগ প্রিন্ট করুন (Print Tag)'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-900 font-semibold opacity-90">
                    {format === 'thermal-compact'
                      ? `৫০x৩০ মিমি রোলে সরাসরি ${activeCopies} টি স্টিকার প্রিন্ট হবে`
                      : `A4 পেজের একদম উপর থেকে ${activeCopies} টি স্টিকার প্রিন্ট হবে`}
                  </span>
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
                    <span>{isGeneratingPdf ? 'তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}</span>
                  </button>
                </div>
              </div>

              {/* Mobile QR Scan & Fast POS Sale Links */}
              <div className="p-3 bg-black/40 border border-white/10 rounded-xl space-y-1.5 text-xs">
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
                <div className="flex gap-2 pt-1">
                  {onOpenLiveCard && (
                    <button
                      type="button"
                      onClick={() => onOpenLiveCard(product)}
                      className="flex-1 py-1.5 px-2 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>লাইভ কার্ড</span>
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
                      <span>দ্রুত বিক্রি</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Interactive Live Printable Preview (7 cols) */}
            <div className="lg:col-span-7 flex flex-col items-center justify-start p-4 bg-slate-950/80 rounded-2xl border border-white/10 overflow-hidden relative">
              <div className="w-full flex items-center justify-between pb-2 text-xs text-slate-400 border-b border-white/10 mb-2">
                <div className="flex items-center gap-1.5 font-bold text-slate-200">
                  <Printer className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {format === 'thermal-compact'
                      ? 'থার্মাল স্টিকার প্রিভিউ (৫০x৩০ মিমি)'
                      : 'A4 পেজ লাইভ প্রিভিউ (উপর থেকে)'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold">
                    {format === 'thermal-compact'
                      ? `থার্মাল (${thermalCopies} টি স্টিকার)`
                      : `A4 শিট (${sheetCount} টি স্টিকার)`}
                  </span>

                  {/* Print Button inside preview header */}
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="py-1 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>প্রিন্ট</span>
                  </button>
                </div>
              </div>

              {/* Scrollable container for preview */}
              <div className="w-full max-h-[58vh] overflow-y-auto flex flex-col items-center justify-start p-2 bg-slate-900/60 rounded-xl border border-white/5">
                <div
                  ref={printableRef}
                  className="bg-white text-slate-900 rounded shadow-2xl p-3 my-1 flex flex-col items-center justify-center"
                  style={{
                    color: '#000000',
                    backgroundColor: '#ffffff',
                    minWidth: format === 'thermal-compact' ? '220px' : '100%',
                  }}
                >
                  {format === 'thermal-compact' ? (
                    <div className="space-y-3 flex flex-col items-center">
                      <div className="text-[10px] text-slate-500 font-mono pb-1 border-b border-slate-200 w-full text-center">
                        🖨️ থার্মাল রোল লেবেল (প্রিন্টারে মোট {thermalCopies} টি বের হবে)
                      </div>
                      {renderThermalSticker(0)}
                      {thermalCopies > 1 && (
                        <div className="text-[9px] text-slate-500 bg-slate-100 px-3 py-1 rounded-full font-mono">
                          +{thermalCopies - 1} টি অতিরিক্ত স্টিকার রোলে পরপর প্রিন্ট হবে
                        </div>
                      )}
                    </div>
                  ) : format === 'sheet-a4' ? (
                    renderA4SheetContent()
                  ) : (
                    /* Garment Hanging tag */
                    <div className="max-w-[280px] mx-auto p-4 bg-white border-2 border-slate-900 rounded-xl relative flex flex-col justify-between text-slate-900">
                      <div className="w-4 h-4 rounded-full border-2 border-dashed border-slate-400 mx-auto -mt-1 mb-2 bg-slate-50 flex items-center justify-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      </div>
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
                            <img src={qrDataUrl} alt="Product QR" className="w-full h-full object-contain" />
                          )}
                        </div>
                      </div>

                      <div className="pt-2 text-center">
                        <div className="text-[9px] uppercase tracking-wider font-bold text-slate-500">
                          সর্বোচ্চ খুচরা বিক্রয় মূল্য (MRP)
                        </div>
                        <div className="text-xl font-black text-slate-900 font-mono tracking-tight mt-0.5">
                          {sellingPrice !== '' ? formatBDT(Number(sellingPrice)) : 'দাম নির্ধারিত নেই'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Helpful Tip */}
              <div className="w-full mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <p className="text-[11px] text-emerald-300 font-medium">
                  {format === 'thermal-compact' ? (
                    <span>
                      💡 থার্মাল প্রিন্টারে প্রিন্ট দিলে <strong>{activeCopies} টি লেবেল রোলে পর পর বের হবে</strong>।
                    </span>
                  ) : (
                    <span>
                      💡 A4 পেজের একদম <strong>উপর থেকে সাজানো</strong> থাকবে — কোনো কাগজ নষ্ট হবে না।
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2 py-1 bg-emerald-500 text-slate-950 font-black rounded text-[11px] hover:bg-emerald-400 cursor-pointer shrink-0 ml-2"
                >
                  🖨️ প্রিন্ট করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. DEDICATED PRINT PORTAL (Mounted directly to document.body) */}
      {createPortal(
        <div id="product-sticker-print-portal" className="hidden print:block">
          {format === 'thermal-compact' ? (
            /* Thermal Printer: sequence of individual labels with page breaks */
            <div className="thermal-print-container">
              {Array.from({ length: thermalCopies }).map((_, i) => renderThermalSticker(i))}
            </div>
          ) : format === 'sheet-a4' ? (
            renderA4SheetContent()
          ) : (
            /* Single Tag */
            <div className="w-full max-w-[194mm] mx-auto bg-white text-black p-2 font-sans">
              <div className="border-2 border-slate-900 rounded p-3 w-[260px] bg-white">
                {renderA4StickerItem(0)}
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};
