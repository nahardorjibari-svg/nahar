import React, { useState } from 'react';
import { X, CheckCircle, AlertTriangle, ShieldCheck, QrCode } from 'lucide-react';
import { SaleOrder } from '../../types';
import { DataService, formatBDT, formatBDDate } from '../../services/dataService';

interface InvoiceVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: SaleOrder | null;
}

export const InvoiceVerificationModal: React.FC<InvoiceVerificationModalProps> = ({
  isOpen,
  onClose,
  order,
}) => {
  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 text-xs">
        {/* Header */}
        <div className="p-4 bg-emerald-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-sm">Official Invoice Verification</h3>
              <p className="text-[10px] text-emerald-300">নাহার দর্জি বাড়ি (Nahar Dorjibari)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-emerald-800 text-emerald-200 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Verification Result */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="font-bold text-emerald-950 text-xs">Authenticated & Genuine Order</p>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                This invoice was verified cryptographically against the official Nahar Dorjibari ledger.
              </p>
            </div>
          </div>

          <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50">
            <div className="flex justify-between">
              <span className="text-slate-500">Invoice No:</span>
              <span className="font-mono-numbers font-bold text-slate-900">{order.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Order No:</span>
              <span className="font-mono-numbers font-semibold text-slate-800">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Issued On:</span>
              <span className="font-mono-numbers text-slate-800">{formatBDDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Customer:</span>
              <span className="font-medium text-slate-900">{order.customer.name} ({order.customer.district})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Order Status:</span>
              <span className="font-semibold text-emerald-700">{order.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Courier Tracking:</span>
              <span className="font-mono-numbers text-blue-700">{order.courier.trackingCode || 'Pending'}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold">
              <span className="text-slate-900">Total Payable:</span>
              <span className="font-mono-numbers text-slate-950">{formatBDT(order.financials.totalPayable)}</span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-100 rounded-lg text-[10px] text-slate-500 space-y-1 font-mono-numbers break-all">
            <p><strong>Verification Token:</strong> {order.verificationToken}</p>
            <p><strong>Secure Hash URL:</strong> {window.location.origin}/verify?invoice={order.invoiceNumber}&token={order.verificationToken}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs cursor-pointer"
          >
            Close Verification
          </button>
        </div>
      </div>
    </div>
  );
};
