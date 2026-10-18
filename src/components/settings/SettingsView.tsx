import React, { useState } from 'react';
import {
  Building2,
  Image,
  Database,
  Truck,
  Save,
  CheckCircle2,
  Sliders,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Waves,
  Palette,
} from 'lucide-react';
import { BrandSettings, GlassTheme } from '../../types';
import { DataService } from '../../services/dataService';
import { getStoredFirebaseConfig } from '../../services/firebaseConfig';

interface SettingsViewProps {
  brandSettings: BrandSettings;
  onBrandSettingsUpdated: (updated: BrandSettings) => void;
  onOpenFirebaseModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  brandSettings,
  onBrandSettingsUpdated,
  onOpenFirebaseModal,
}) => {
  const [brandName, setBrandName] = useState(brandSettings.brandName);
  const [logoUrl, setLogoUrl] = useState(brandSettings.logoUrl);
  const [slogan, setSlogan] = useState(brandSettings.slogan);
  const [currency, setCurrency] = useState(brandSettings.currency);
  const [phone, setPhone] = useState(brandSettings.phone);
  const [email, setEmail] = useState(brandSettings.email);
  const [address, setAddress] = useState(brandSettings.address);
  const [branch, setBranch] = useState(brandSettings.branch);
  const [defaultThreshold, setDefaultThreshold] = useState(brandSettings.defaultLowStockThreshold);
  const [invoiceNote, setInvoiceNote] = useState(brandSettings.invoiceNote);

  // Dynamic Glass Theme customizer state
  const [currentTheme, setCurrentTheme] = useState<GlassTheme>(() => {
    return (localStorage.getItem('nahar_glass_theme') as GlassTheme) || 'emerald';
  });
  const [auraMotion, setAuraMotion] = useState<boolean>(() => {
    return localStorage.getItem('nahar_glass_motion') !== 'false';
  });

  // Steadfast Courier Settings State
  const [steadfastApiKey, setSteadfastApiKey] = useState('sf_live_key_9831a0x...');
  const [steadfastSecretKey, setSteadfastSecretKey] = useState('sf_sec_44109...');
  const [steadfastBaseUrl, setSteadfastBaseUrl] = useState('https://portal.steadfast.com.bd/api/v1/');

  const [isSaved, setIsSaved] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const isCloud = DataService.isCloudMode();
  const firebaseConfig = getStoredFirebaseConfig();

  const handleSaveBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = await DataService.updateBrandSettings({
      brandName: brandName.trim(),
      logoUrl: logoUrl.trim(),
      slogan: slogan.trim(),
      currency: currency.trim() || '৳',
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      branch: branch.trim(),
      defaultLowStockThreshold: Number(defaultThreshold) || 5,
      invoiceNote: invoiceNote.trim(),
    });

    onBrandSettingsUpdated(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSelectTheme = (theme: GlassTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem('nahar_glass_theme', theme);
    document.querySelector('[data-theme]')?.setAttribute('data-theme', theme);
  };

  const handleToggleMotion = () => {
    const next = !auraMotion;
    setAuraMotion(next);
    localStorage.setItem('nahar_glass_motion', String(next));
    window.location.reload();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Dynamic Glass Theme Customizer Card */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Dynamic Glassmorphism Atmosphere</h3>
              <p className="text-xs text-slate-400">
                Live refractive glass styling with fluid ambient light auras
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleMotion}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border transition-all ${
              auraMotion 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)]' 
                : 'glass-card text-slate-400 hover:text-white'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>{auraMotion ? 'Aura Motion: Active' : 'Aura Motion: Paused'}</span>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="block font-semibold text-white text-xs mb-2">
            Select Software Theme Preset:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { id: 'emerald' as GlassTheme, label: 'Emerald Luxury', dot: 'bg-emerald-400', desc: 'Bespoke Green & Gold' },
              { id: 'sapphire' as GlassTheme, label: 'Midnight Sapphire', dot: 'bg-sky-400', desc: 'Electric Cyan & Indigo' },
              { id: 'amethyst' as GlassTheme, label: 'Royal Amethyst', dot: 'bg-purple-400', desc: 'Velvet Violet & Rose' },
              { id: 'amber' as GlassTheme, label: 'Imperial Gold', dot: 'bg-amber-400', desc: 'Warm Amber & Sunset' },
            ].map((th) => {
              const active = currentTheme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => handleSelectTheme(th.id)}
                  className={`p-3 rounded-xl glass-card text-left transition-all cursor-pointer border ${
                    active 
                      ? 'border-white/30 bg-white/15 shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-1 ring-white/30' 
                      : 'hover:border-white/20 hover:bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-3 h-3 rounded-full ${th.dot} shadow-sm`} />
                    <span className="font-bold text-xs text-white">{th.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">{th.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Brand Identity & Logo Configuration */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Brand Identity & Showroom Configuration</h3>
              <p className="text-xs text-slate-400">
                Configure your boutique brand name, logo, contact information, and default thresholds
              </p>
            </div>
          </div>
          {isSaved && (
            <span className="text-xs text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Settings Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSaveBrand} className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Boutique Brand Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
                className="w-full px-3 py-2.5 glass-input rounded-xl text-xs font-bold text-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Displayed on navigation, invoices, and reports</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Brand Tagline / Slogan</label>
              <input
                type="text"
                value={slogan}
                onChange={(e) => setSlogan(e.target.value)}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Official tagline printed on memos</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Hotline / Mobile Phone</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-xs font-mono-numbers text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Support Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Showroom / Branch</label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Physical Store Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Brand Logo URL</label>
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl border border-white/20 p-1 overflow-hidden bg-black/40 shadow-inner flex items-center justify-center shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Image className="w-8 h-8 text-slate-600" />
                )}
              </div>
              <input
                type="text"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="flex-1 px-3 py-2.5 glass-input rounded-xl text-xs text-white"
                placeholder="https://..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Default Low Stock Alert Threshold</label>
              <input
                type="number"
                min="1"
                value={defaultThreshold}
                onChange={(e) => setDefaultThreshold(Number(e.target.value))}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-xs font-mono-numbers text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Invoice Footer Legal Note</label>
              <input
                type="text"
                value={invoiceNote}
                onChange={(e) => setInvoiceNote(e.target.value)}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold rounded-xl text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Brand Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* Firebase Cloud Firestore Setup & Guidelines */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-sky-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Firebase Cloud Infrastructure</h3>
              <p className="text-xs text-slate-400">
                Cloud Firestore, Authentication & Storage persistence configuration
              </p>
            </div>
          </div>

          <button
            onClick={onOpenFirebaseModal}
            className="px-3.5 py-1.5 glass-card text-white text-xs font-semibold rounded-xl hover:border-white/30 cursor-pointer flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-sky-400" />
            <span>Configure Firebase</span>
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            isCloud
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
          }`}>
            {isCloud ? (
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <div>
              <h4 className="font-bold text-xs text-white">
                {isCloud ? 'Connected to Cloud Firestore' : 'Running in Local Browser Demo Mode'}
              </h4>
              <p className="mt-0.5 leading-relaxed text-slate-300">
                {isCloud
                  ? `Active Firebase Project: ${firebaseConfig?.projectId}. Product catalog, stock adjustments, and audit ledger are syncing live in Cloud Firestore.`
                  : 'Changes are preserved in your current browser session. To enable cross-device persistence and cloud backups, connect your Firebase project.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Steadfast Courier Integration */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-2.5">
            <Truck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Steadfast Courier API Gateway</h3>
              <p className="text-xs text-slate-400">
                Nationwide Bangladesh Cash-on-Delivery (COD) consignment gateway
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full">
            Active in Order Entry
          </span>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Steadfast API Key</label>
              <input
                type="text"
                value={steadfastApiKey}
                onChange={(e) => setSteadfastApiKey(e.target.value)}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-xs font-mono-numbers text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Steadfast Secret Key</label>
              <input
                type="password"
                value={steadfastSecretKey}
                onChange={(e) => setSteadfastSecretKey(e.target.value)}
                className="w-full px-3 py-2.5 glass-input rounded-xl text-xs font-mono-numbers text-white"
              />
            </div>
          </div>
          
          <div className="pt-6 mt-6 border-t border-white/10">
            <h4 className="font-bold text-rose-400 mb-3">Danger Zone: Data Wipe</h4>
          <div className="pt-6 mt-6 border-t border-white/10">
            <h4 className="font-bold text-rose-400 mb-3">Danger Zone: Data Wipe</h4>
            {showClearConfirm ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-white font-semibold">Are you sure?</span>
                <button
                  onClick={() => DataService.clearAllData()}
                  className="px-4 py-2 bg-rose-500 text-slate-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Yes
                </button>
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 glass-card text-slate-300 hover:text-white border border-white/10 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Clear All Application Data
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};
