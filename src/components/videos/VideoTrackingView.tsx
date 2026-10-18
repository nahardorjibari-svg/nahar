import React, { useState, useMemo } from 'react';
import {
  Video,
  Plus,
  Search,
  ExternalLink,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  X,
  Check,
  Tag,
  BarChart3,
} from 'lucide-react';
import { VideoPost, Product, SaleOrder } from '../../types';
import { DataService, formatBDT, formatBDDate } from '../../services/dataService';

interface VideoTrackingViewProps {
  videos: VideoPost[];
  products: Product[];
  orders: SaleOrder[];
  onVideoCreated: () => void;
  onNavigateToNewSale: (videoId?: string) => void;
}

const PLATFORMS = [
  'Facebook Live',
  'Facebook Reel',
  'TikTok',
  'YouTube',
  'Instagram',
] as const;

export const VideoTrackingView: React.FC<VideoTrackingViewProps> = ({
  videos,
  products,
  orders,
  onVideoCreated,
  onNavigateToNewSale,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedVideoForDetails, setSelectedVideoForDetails] = useState<VideoPost | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState<typeof PLATFORMS[number]>('Facebook Live');
  const [postDate, setPostDate] = useState(new Date().toISOString().slice(0, 10));
  const [url, setUrl] = useState('');
  const [adSpend, setAdSpend] = useState<number | ''>(1000);
  const [notes, setNotes] = useState('');
  const [offerings, setOfferings] = useState<Array<{ productCode: string; advertisedPrice: number; notes?: string }>>([]);

  const [productCodeInput, setProductCodeInput] = useState('');
  const [priceInput, setPriceInput] = useState<number | ''>('');
  const [offeringNotesInput, setOfferingNotesInput] = useState('');

  // Performance analytics per video
  const videoStats = useMemo(() => {
    const map = new Map<string, { orderCount: number; totalRevenue: number; netProfit: number; unitsSold: number }>();

    orders.forEach(ord => {
      if (ord.originVideoId && ord.status !== 'CANCELLED') {
        const current = map.get(ord.originVideoId) || { orderCount: 0, totalRevenue: 0, netProfit: 0, unitsSold: 0 };
        current.orderCount += 1;
        current.totalRevenue += ord.financials.subtotal;
        current.netProfit += ord.financials.netProfit;
        current.unitsSold += ord.items.reduce((acc, i) => acc + i.quantity, 0);
        map.set(ord.originVideoId, current);
      }
    });

    return map;
  }, [orders]);

  const handleAddOffering = () => {
    if (!productCodeInput.trim() || priceInput === '') return;
    const code = productCodeInput.trim().toUpperCase();

    // Check if valid product
    const prod = products.find(p => p.productCode.toUpperCase() === code);
    if (!prod) {
      alert(`Product code "${code}" does not exist in catalog.`);
      return;
    }

    setOfferings([
      ...offerings,
      {
        productCode: code,
        advertisedPrice: Number(priceInput),
        notes: offeringNotesInput.trim(),
      },
    ]);

    setProductCodeInput('');
    setPriceInput('');
    setOfferingNotesInput('');
  };

  const handleRemoveOffering = (index: number) => {
    setOfferings(offerings.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a video/post campaign title.');
      return;
    }

    if (offerings.length === 0) {
      alert('Please link at least one product with its advertised video price.');
      return;
    }

    try {
      await DataService.addVideoPost({
        title: title.trim(),
        platform,
        postDate: new Date(postDate).toISOString(),
        url: url.trim(),
        productOfferings: offerings,
        adSpend: Number(adSpend) || 0,
        notes: notes.trim(),
      });

      onVideoCreated();
      setIsModalOpen(false);
      // Reset
      setTitle('');
      setUrl('');
      setNotes('');
      setOfferings([]);
    } catch (err: any) {
      alert(err.message || 'Error saving video post');
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (window.confirm('Delete this video/post tracking record?')) {
      await DataService.deleteVideoPost(id);
      onVideoCreated();
    }
  };

  const filteredVideos = videos.filter(
    v =>
      v.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.productCodes.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-white/15 shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div>
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Video className="w-5 h-5 text-blue-400" />
            <span>Video & Social Live Post Tracking (ভিডিও ও লাইভ ক্যাম্পেইন)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track Facebook Live sessions, Reels, and TikTok posts. Set unique advertised promo prices and measure actual sales conversion & ROI.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Video / Live Post</span>
        </button>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVideos.map(video => {
          const stats = videoStats.get(video.id) || { orderCount: 0, totalRevenue: 0, netProfit: 0, unitsSold: 0 };
          const netRoas = video.adSpend > 0 ? (stats.totalRevenue / video.adSpend).toFixed(1) : 'N/A';

          return (
            <div
              key={video.id}
              className="glass-card glass-shine-top rounded-2xl border border-white/15 overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {video.platform}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono-numbers">
                    {formatBDDate(video.postDate).slice(0, 11)}
                  </span>
                </div>

                <h3 className="font-bold text-white text-sm leading-snug line-clamp-2">
                  {video.title}
                </h3>

                {/* Offerings list */}
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Featured Products & Promo Rates:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {video.productOfferings.map(off => (
                      <span
                        key={off.productCode}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-black/40 border border-white/15 rounded text-[11px] font-mono-numbers"
                      >
                        <strong className="text-white">{off.productCode}</strong>
                        <span className="text-emerald-400 font-semibold">{formatBDT(off.advertisedPrice)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Live Performance Strip */}
                <div className="p-3 bg-black/30 rounded-xl border border-white/10 grid grid-cols-3 gap-2 text-center text-xs font-mono-numbers">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Sales Orders</span>
                    <strong className="text-white text-sm">{stats.orderCount}</strong>
                    <span className="text-[9px] text-slate-400 block">({stats.unitsSold} pcs)</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Revenue</span>
                    <strong className="text-white text-xs">{formatBDT(stats.totalRevenue)}</strong>
                    <span className="text-[9px] text-slate-400 block">Ad: {formatBDT(video.adSpend)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Net Profit</span>
                    <strong className="text-emerald-400 text-xs">+{formatBDT(stats.netProfit)}</strong>
                    <span className="text-[9px] text-blue-400 block">{netRoas}x ROAS</span>
                  </div>
                </div>

                {video.notes && (
                  <p className="text-[11px] text-slate-400 italic line-clamp-2">"{video.notes}"</p>
                )}
              </div>

              {/* Actions */}
              <div className="p-3 bg-white/5 border-t border-white/10 flex items-center justify-between gap-2">
                <button
                  onClick={() => onNavigateToNewSale(video.id)}
                  className="flex-1 py-1.5 px-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.3)] transition-colors"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-950" />
                  <span>Sell from this Video</span>
                </button>

                {video.url && (
                  <a
                    href={video.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10"
                    title="Open Video URL"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                <button
                  onClick={() => handleDeleteVideo(video.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/20"
                  title="Delete Video Record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Video / Post */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="glass-panel-elevated rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-white/20 text-xs text-slate-100 relative">
            <div className="absolute top-0 left-10 right-10 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
            <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">Register Video / Live Post Campaign</h3>
                <p className="text-[11px] text-slate-400">Link 3-piece models with advertised promo rates</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Video / Live Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Friday Evening Eid Special Live #15"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Platform</label>
                  <select
                    value={platform}
                    onChange={e => setPlatform(e.target.value as any)}
                    className="w-full px-3 py-2 border border-white/15 bg-[#0c1222] rounded-lg text-xs text-white focus:outline-none focus:border-blue-400"
                  >
                    {PLATFORMS.map(p => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Post / Broadcast Date</label>
                  <input
                    type="date"
                    value={postDate}
                    onChange={e => setPostDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-xs font-mono-numbers text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Video / Post URL</label>
                  <input
                    type="url"
                    placeholder="https://facebook.com/..."
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Allocated Ad Spend (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="1000"
                    value={adSpend}
                    onChange={e => setAdSpend(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-xs font-mono-numbers text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Offerings Builder */}
              <div className="p-3.5 bg-black/30 border border-white/15 rounded-xl space-y-3">
                <span className="font-semibold text-white text-xs block">
                  Link Products & Advertised Prices:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={productCodeInput}
                    onChange={e => {
                      setProductCodeInput(e.target.value);
                      const p = products.find(prod => prod.productCode === e.target.value);
                      if (p) setPriceInput(p.defaultSellingPrice || p.purchaseCost);
                    }}
                    className="px-2 py-1.5 border border-white/15 bg-[#0c1222] rounded text-xs text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="">Select Product...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.productCode}>
                        {p.productCode} - {p.name}
                      </option>
                    ))}
                  </select>

                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">৳</span>
                    <input
                      type="number"
                      placeholder="Advertised ৳"
                      value={priceInput}
                      onChange={e => setPriceInput(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full pl-6 pr-2 py-1.5 bg-black/40 border border-white/15 rounded text-xs font-mono-numbers font-bold text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOffering}
                    className="py-1.5 px-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-slate-950 rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    + Add Product
                  </button>
                </div>

                {offerings.length > 0 && (
                  <div className="space-y-1 pt-2">
                    {offerings.map((off, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white/5 border border-white/10 rounded text-xs"
                      >
                        <span className="font-mono-numbers font-bold text-white">
                          {off.productCode} → {formatBDT(off.advertisedPrice)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOffering(idx)}
                          className="text-rose-400 hover:text-rose-300 text-[11px]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Campaign Notes / Key Selling Points</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Free delivery announced for live viewers ordering within 2 hours."
                  className="w-full px-3 py-2 bg-black/40 border border-white/15 rounded-lg text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-white/15 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-slate-950 font-bold rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-colors cursor-pointer"
                >
                  Save Campaign Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
