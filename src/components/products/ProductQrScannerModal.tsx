import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  Search,
  QrCode,
  Sparkles,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Product } from '../../types';

interface ProductQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductFound: (product: Product) => void;
}

export const ProductQrScannerModal: React.FC<ProductQrScannerModalProps> = ({
  isOpen,
  onClose,
  products,
  onProductFound,
}) => {
  if (!isOpen) return null;

  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera on unmount or close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access not available or denied:', err);
      setErrorMessage(
        'ক্যামেরা চালু করা যায়নি (অনুমতি দিন অথবা নিচে সরাসরি কোড লিখে খুঁজুন)।'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleClose = () => {
    stopCamera();
    onClose();
  };

  const handleSearchCode = (rawCode: string) => {
    const clean = rawCode.trim().toUpperCase();
    if (!clean) return;

    // Check if user scanned full URL e.g. ?scan_product=RP-001
    let targetCode = clean;
    if (clean.includes('SCAN_PRODUCT=')) {
      const parts = clean.split('SCAN_PRODUCT=');
      targetCode = parts[1].split('&')[0];
    } else if (clean.includes('PRODUCT=')) {
      const parts = clean.split('PRODUCT=');
      targetCode = parts[1].split('&')[0];
    }

    const matched = products.find(
      (p) =>
        p.productCode.toUpperCase() === targetCode.toUpperCase() ||
        p.id === targetCode ||
        p.name.toUpperCase().includes(targetCode)
    );

    if (matched) {
      stopCamera();
      onProductFound(matched);
      onClose();
    } else {
      setErrorMessage(`কোড "${targetCode}" দিয়ে কোনো পণ্য খুঁজে পাওয়া যায়নি।`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchCode(inputCode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel-elevated rounded-2xl shadow-2xl max-w-md w-full flex flex-col border border-white/20 text-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                প্রোডাক্ট QR কোড ও বারকোড স্ক্যানার
              </h3>
              <p className="text-[11px] text-slate-400">
                পোশাকের স্টিকার স্ক্যান করে লাইভ রেট ও স্টক দেখুন
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Camera Viewfinder Box */}
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-black/60 border-2 border-dashed border-emerald-500/40 flex flex-col items-center justify-center p-4 text-center">
            {isCameraActive ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover rounded-xl"
                  playsInline
                  autoPlay
                  muted
                />
                {/* Scanner Target Box Overlay */}
                <div className="absolute inset-8 border-2 border-emerald-400/80 rounded-xl pointer-events-none flex items-center justify-center">
                  <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_8px_#10b981] animate-bounce" />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-emerald-400">
                  <Camera className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">
                    মোবাইল ক্যামেরা দিয়ে সরাসরি স্ক্যান করুন
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    পোশাকের ট্যাগে থাকা কিউআর কোড ক্যামেরার সামনে ধরুন
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 rounded-xl text-xs font-bold cursor-pointer transition-all inline-flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>ক্যামেরা চালু করুন</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Manual Code Input / Barcode Gun Reader */}
          <form onSubmit={handleSubmit} className="space-y-2 pt-1">
            <label className="block text-xs font-bold text-slate-200">
              অথবা বারকোড / প্রোডাক্ট কোড দিয়ে খুঁজুন:
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="যেমন: RP-001 বা স্ক্যানার দিয়ে এন্টার করুন"
                  value={inputCode}
                  onChange={(e) => {
                    setInputCode(e.target.value);
                    setErrorMessage(null);
                  }}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2.5 glass-input rounded-xl text-xs uppercase font-mono-numbers text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow transition-all flex items-center gap-1"
              >
                <span>খুঁজুন</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Quick Code Chips from stock */}
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase tracking-wider">
              দ্রুত সিলেক্ট করুন (Recent Products):
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {products.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSearchCode(p.productCode)}
                  className="px-2.5 py-1 glass-card hover:bg-white/15 border border-white/15 rounded-lg text-[11px] font-mono-numbers text-emerald-300 font-bold cursor-pointer transition-colors"
                >
                  {p.productCode}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
