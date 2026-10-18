import React, { useState, useMemo } from 'react';
import {
  Users,
  Phone,
  MapPin,
  ShoppingBag,
  Search,
  Calendar,
  ExternalLink,
  DollarSign,
  UserCheck,
} from 'lucide-react';
import { Customer, SaleOrder } from '../../types';
import { formatBDT, formatBDDate } from '../../services/dataService';

interface CustomersViewProps {
  customers: Customer[];
  orders: SaleOrder[];
  onNavigateToNewSale?: (customer: Customer) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  orders,
  onNavigateToNewSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers;
    const q = searchTerm.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q)
    );
  }, [customers, searchTerm]);

  // Customer order history
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter(
      (o) =>
        o.customer.phone === selectedCustomer.phone ||
        o.customer.id === selectedCustomer.id ||
        o.customer.name.toLowerCase() === selectedCustomer.name.toLowerCase()
    );
  }, [orders, selectedCustomer]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <span>Customer Directory & Lifetime Value</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Registered patrons across Bangladesh with verified delivery addresses and purchase ledgers
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono-numbers px-3 py-1 bg-white/10 text-white rounded-xl font-bold border border-white/15 shadow-inner">
            {customers.length} Patrons
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Directory Table (8 cols) */}
        <div className="lg:col-span-8 glass-panel rounded-2xl border border-white/15 overflow-hidden shadow-xl relative">
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between gap-3">
            <div className="relative max-w-sm w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by Name, Phone (+880), or District..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 glass-input rounded-xl text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-400"
              />
            </div>
            <span className="text-[11px] text-slate-400 font-mono-numbers">
              {filteredCustomers.length} results
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-300 uppercase font-semibold text-[11px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact Phone</th>
                  <th className="py-3 px-4">District / Area</th>
                  <th className="py-3 px-4 text-center">Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Spend</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-slate-200">
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      No customer found matching "{searchTerm}".
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((c) => {
                    const isSelected = selectedCustomer?.id === c.id;
                    const tier =
                      c.totalSpent > 10000
                        ? 'VIP Patron'
                        : c.totalOrders > 2
                        ? 'Regular'
                        : 'New Patron';

                    return (
                      <tr
                        key={c.id}
                        className={`hover:bg-white/[0.04] transition-colors ${
                          isSelected ? 'bg-white/10' : ''
                        }`}
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">{c.name}</span>
                          <span
                            className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 border ${
                              tier === 'VIP Patron'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : tier === 'Regular'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                : 'bg-white/10 text-slate-300 border-white/10'
                            }`}
                          >
                            {tier}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-300 font-mono-numbers font-medium">
                          {c.phone}
                        </td>

                        <td className="py-3 px-4 text-slate-400">
                          <span className="font-semibold text-white block">{c.district}</span>
                          <span className="text-[11px] text-slate-400 block truncate max-w-xs">
                            {c.address}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono-numbers font-bold text-white">
                          {c.totalOrders}
                        </td>

                        <td className="py-3 px-4 text-right font-mono-numbers font-bold text-emerald-400">
                          {formatBDT(c.totalSpent)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => setSelectedCustomer(c)}
                            className="px-2.5 py-1 glass-card hover:border-white/30 text-white font-semibold rounded-lg text-[11px] transition-colors cursor-pointer"
                          >
                            History
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Customer Profile & Purchase History (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {selectedCustomer ? (
            <div className="glass-card glass-shine-top rounded-2xl border border-white/15 p-5 shadow-xl space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-bold text-white text-sm">{selectedCustomer.name}</h3>
                  <p className="text-[11px] text-slate-400 font-mono-numbers">{selectedCustomer.phone}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-slate-400 hover:text-white font-bold cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>

              {/* Delivery Address Box */}
              <div className="p-3 bg-black/30 border border-white/10 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                  Delivery Destination
                </span>
                <p className="font-semibold text-white">{selectedCustomer.district}</p>
                <p className="text-slate-300 text-[11px] leading-relaxed">{selectedCustomer.address}</p>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-black/30 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Orders</span>
                  <span className="text-base font-bold text-white font-mono-numbers">
                    {selectedCustomer.totalOrders}
                  </span>
                </div>
                <div className="p-3 bg-black/30 rounded-xl border border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Spent</span>
                  <span className="text-base font-bold text-emerald-400 font-mono-numbers">
                    {formatBDT(selectedCustomer.totalSpent)}
                  </span>
                </div>
              </div>

              {/* Order History */}
              <div className="space-y-2">
                <span className="font-bold text-slate-300 text-[11px] block">Past Orders</span>
                {customerOrders.length === 0 ? (
                  <p className="text-slate-500 text-[11px] italic">No recent order history recorded.</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {customerOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="p-2.5 bg-black/30 rounded-xl border border-white/10 space-y-1 hover:border-white/20 transition-all"
                      >
                        <div className="flex justify-between items-center font-mono-numbers">
                          <span className="font-bold text-white">{ord.orderNumber}</span>
                          <span className="font-bold text-emerald-400">
                            {formatBDT(ord.financials.totalPayable)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex justify-between">
                          <span>{formatBDDate(ord.createdAt)}</span>
                          <span className="font-bold text-sky-400">{ord.payment.status}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {ord.items.map((i) => `${i.productCode} (${i.quantity}x)`).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center glass-panel rounded-2xl border border-white/15 text-slate-400 text-xs">
              <UserCheck className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-400" />
              <p className="font-semibold text-white">Select a Customer</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Click "History" on any customer to inspect verified delivery details and orders.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
