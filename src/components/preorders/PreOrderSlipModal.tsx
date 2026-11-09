import React, { useRef, useEffect, useState } from 'react';
import { X, Printer, Download, Truck, Package, Phone, MapPin, User, CheckCircle2, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { PreOrder, BrandSettings } from '../../types';
import { formatBDT, formatBDDate } from '../../services/dataService';

interface PreOrderSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  preOrder: PreOrder | null;
  brandSettings: BrandSettings;
  onMarkDone?: (id: string) => void;
}

export const PreOrderSlipModal: React.FC<PreOrderSlipModalProps> = ({
  isOpen,
  onClose,
  preOrder,
  brandSettings,
  onMarkDone,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preOrder) {
      const trackingPayload = `ND-PARCEL:${preOrder.orderNumber}|${preOrder.phone}|COD:${preOrder.dueAmount}`;
      QRCode.toDataURL(trackingPayload, {
        width: 140,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate parcel QR', err));
    }
  }, [preOrder]);

  if (!isOpen || !preOrder) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!slipRef.current) return;
    try {
      setIsGeneratingPdf(true);
      const canvas = await html2canvas(slipRef.current, {
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
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      pdf.save(`parcel-slip-${preOrder.orderNumber}.pdf`);
    } catch (err) {
      console.error('PDF error', err);
      alert('স্লিপ ডাউনলোড করতে সমস্যা হয়েছে। প্রিন্ট বাটন ব্যবহার করুন।');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel-elevated rounded-2xl shadow-2xl max-w-3xl w-full max-h-[95vh] flex flex-col border border-white/20 text-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Truck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  কুরিয়ার ডেলিভারি ও পার্সেল স্লিপ (Parcel Packing Slip)
                </h3>
                <span className="font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/30">
                  {preOrder.orderNumber}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                পার্সেলের সাথে লাগানোর জন্য বা কুরিয়ার হ্যান্ডওভারের অফিসিয়াল চালান স্লিপ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>প্রিন্ট করুন</span>
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-white/15 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isGeneratingPdf ? 'তৈরি হচ্ছে...' : 'PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Slip Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/70 flex justify-center">
          <div
            ref={slipRef}
            id="invoice-printable-sheet"
            className="w-full max-w-[650px] bg-white text-slate-900 rounded-xl shadow-2xl p-6 sm:p-7 border-2 border-slate-900 font-sans print:border-none print:shadow-none print:p-2"
            style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
          >
            {/* Top Brand Header */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-3">
                {brandSettings.logoUrl ? (
                  <img
                    src={brandSettings.logoUrl}
                    alt={brandSettings.brandName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-slate-900"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-black text-xl flex items-center justify-center">
                    ন
                  </div>
                )}
                <div>
                  <h1 className="font-black text-lg text-slate-950 tracking-tight leading-none">
                    {brandSettings.brandName}
                  </h1>
                  <p className="text-[10px] text-slate-600 font-bold mt-0.5">
                    {brandSettings.slogan || 'এক্সক্লুসিভ বুটিক ও অর্গানিক স্টোর'}
                  </p>
                  <p className="text-[9px] text-slate-500 leading-tight">
                    {brandSettings.address} · ফোন: {brandSettings.phone}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-slate-900 text-white text-[11px] font-black rounded tracking-wide uppercase">
                  কুরিয়ার পার্সেল স্লিপ
                </span>
                <p className="font-mono font-bold text-xs text-slate-900 mt-1">
                  {preOrder.orderNumber}
                </p>
                <p className="text-[10px] text-slate-500">{formatBDDate(preOrder.createdAt)}</p>
              </div>
            </div>

            {/* Sender & Recipient Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
              {/* Sender Details */}
              <div className="p-3 rounded-lg border border-slate-300 bg-slate-50/80 space-y-1">
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                  <Package className="w-3 h-3 text-slate-700" />
                  <span>প্রেরক (From / Sender):</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 leading-tight">
                  {brandSettings.brandName}
                </h4>
                <p className="text-[10px] text-slate-600">
                  ফোন: <span className="font-mono font-bold text-slate-900">{brandSettings.phone}</span>
                </p>
                <p className="text-[9px] text-slate-500 leading-tight">
                  {brandSettings.address}
                </p>
              </div>

              {/* Recipient Details */}
              <div className="p-3 rounded-lg border-2 border-emerald-600 bg-emerald-50/30 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-emerald-700" />
                    <span>প্রাপক (To / Customer):</span>
                  </span>
                  <span className="font-mono bg-emerald-700 text-white px-1.5 py-0.2 rounded text-[9px]">
                    {preOrder.district}
                  </span>
                </div>
                <h4 className="font-black text-sm text-slate-950 leading-tight">
                  👤 {preOrder.customerName}
                </h4>
                <p className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                  📞 <span className="font-mono text-emerald-800 tracking-wide text-xs">{preOrder.phone}</span>
                </p>
                <p className="text-[10px] text-slate-700 leading-snug pt-0.5">
                  📍 <strong>ঠিকানা:</strong> {preOrder.fullAddress}
                </p>
              </div>
            </div>

            {/* Products Table */}
            <div className="border border-slate-300 rounded-lg overflow-hidden my-3">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-2.5">পণ্য (Product)</th>
                    <th className="py-2 px-2 text-center">কোড</th>
                    <th className="py-2 px-2 text-right">দর</th>
                    <th className="py-2 px-2 text-center">পরিমাণ</th>
                    <th className="py-2 px-2.5 text-right">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {preOrder.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 flex items-center gap-2">
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="w-8 h-8 rounded object-cover border border-slate-300 shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <div>
                          <div className="font-bold text-slate-900 text-[11px] leading-tight">
                            {item.productName}
                          </div>
                          {item.category && (
                            <div className="text-[9px] text-slate-500">{item.category}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-[10px] text-slate-700">
                        {item.productCode}
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-[11px]">
                        {formatBDT(item.unitPrice)}
                      </td>
                      <td className="py-2 px-2 text-center font-mono font-bold text-slate-900 text-xs">
                        {item.quantity} টি
                      </td>
                      <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-950 text-xs">
                        {formatBDT(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Section: Notes + Financials Box */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              {/* Left Column: Courier Partner & QR Code */}
              <div className="sm:col-span-6 space-y-2">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-3">
                  <div className="w-14 h-14 bg-white p-0.5 border border-slate-300 rounded shrink-0 flex items-center justify-center">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR" className="w-full h-full object-contain" />
                    ) : (
                      <QrCode className="w-10 h-10 text-slate-400" />
                    )}
                  </div>
                  <div className="text-[10px] space-y-0.5 min-w-0">
                    <span className="font-bold text-slate-800 block">
                      কুরিয়ার পার্টনার: {preOrder.courierName || 'Steadfast Courier'}
                    </span>
                    <p className="text-[9px] text-slate-500 leading-tight">
                      ডেলিভারির সময় ক্যাশ কালেকশন করে স্লিপে স্বাক্ষর নিন।
                    </p>
                    {preOrder.notes && (
                      <p className="text-[9px] text-amber-800 bg-amber-50 p-1 rounded font-medium border border-amber-200">
                        নোট: {preOrder.notes}
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-[8.5px] text-slate-400 italic">
                  * গ্রাহকের কাছে পণ্য অক্ষত অবস্থায় পৌঁছানো নিশ্চিত করুন। কোনো সমস্যা হলে কল করুন {brandSettings.phone}
                </div>
              </div>

              {/* Right Column: Financials & Large COD Due Box */}
              <div className="sm:col-span-6 space-y-1 text-xs">
                <div className="flex justify-between py-0.5 text-slate-600">
                  <span>মোট পণ্য মূল্য:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatBDT(preOrder.totalAmount - (preOrder.deliveryFee || 0))}
                  </span>
                </div>

                <div className="flex justify-between py-0.5 text-slate-600">
                  <span>ডেলিভারি চার্জ:</span>
                  <span className="font-mono font-bold text-slate-800">
                    +{formatBDT(preOrder.deliveryFee || 0)}
                  </span>
                </div>

                {preOrder.advancePayment > 0 && (
                  <div className="flex justify-between py-0.5 text-emerald-700 font-semibold border-t border-slate-200">
                    <span>অগ্রিম প্রাপ্ত (Advance Paid):</span>
                    <span className="font-mono font-bold">
                      -{formatBDT(preOrder.advancePayment)}
                    </span>
                  </div>
                )}

                {/* BIG COD COLLECTION HIGHLIGHT */}
                <div className="mt-2 p-2.5 rounded-xl border-2 border-slate-900 bg-slate-900 text-white text-center shadow-md">
                  <div className="text-[9px] uppercase tracking-wider font-bold text-emerald-300">
                    ক্যাশ অন ডেলিভারি (কাস্টমার থেকে আদায়যোগ্য)
                  </div>
                  <div className="text-2xl font-black font-mono tracking-tight text-white mt-0.5">
                    {formatBDT(preOrder.dueAmount)}
                  </div>
                  <div className="text-[8.5px] text-slate-300 mt-0.5 font-medium">
                    {preOrder.dueAmount <= 0 ? 'সম্পূর্ণ মূল্য পরিশোধিত' : 'COD কালেকশন সম্পন্ন করুন'}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Signatures */}
            <div className="flex justify-between items-end pt-6 mt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-500">
              <div className="text-center">
                <div className="w-28 border-b border-slate-400 mb-1"></div>
                <span>কুরিয়ার প্রতিনিধি স্বাক্ষর</span>
              </div>
              <div className="text-center">
                <div className="w-28 border-b border-slate-400 mb-1"></div>
                <span>নাহার দর্জি বাড়ি কর্তৃপক্ষ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Bar with Fast Actions */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/5 flex items-center justify-between text-xs">
          <span className="text-slate-400">
            স্ট্যাটাস: <strong className="text-emerald-400">{preOrder.status}</strong>
          </span>

          <div className="flex items-center gap-2">
            {onMarkDone && preOrder.status !== 'DONE' && (
              <button
                type="button"
                onClick={() => {
                  onMarkDone(preOrder.id);
                  onClose();
                }}
                className="py-1.5 px-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>অর্ডারটি 'Done / সম্পন্ন' করুন</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-3 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
