import React, { useState } from 'react';
import { Lock, Mail, Shield, ArrowRight, Sparkles, Upload, CheckCircle2 } from 'lucide-react';
import { BrandSettings, UserSession } from '../../types';
import { DataService } from '../../services/dataService';

interface AdminLoginViewProps {
  brandSettings: BrandSettings;
  onLoginSuccess: (user: UserSession) => void;
  onBrandSettingsUpdated?: (settings: BrandSettings) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  brandSettings,
  onLoginSuccess,
  onBrandSettingsUpdated,
}) => {
  const [selectedRole, setSelectedRole] = useState<'Super Admin' | 'Admin' | 'User'>('Super Admin');
  const [userId, setUserId] = useState('admin@nahardorjibari.com');
  const [password, setPassword] = useState('••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (typeof reader.result === 'string') {
        try {
          const updated = await DataService.updateBrandSettings({ logoUrl: reader.result });
          if (onBrandSettingsUpdated) {
            onBrandSettingsUpdated(updated);
          }
        } catch (err) {
          console.error('Failed to update logo', err);
        } finally {
          setLogoUploading(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      onLoginSuccess({
        id: `usr-${selectedRole.toLowerCase().replace(' ', '-')}-01`,
        name: selectedRole === 'Super Admin' ? 'Super Admin (Md Johurul Islam)' : selectedRole === 'Admin' ? 'Store Admin' : 'Staff User',
        email: userId.trim(),
        role: selectedRole === 'Super Admin' ? 'Super Admin' : selectedRole === 'Admin' ? 'Store Manager' : 'Sales Executive',
        branch: brandSettings.branch || 'Hemayetpur Factory Showroom',
        isAuthenticated: true,
      });
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center p-4 overflow-hidden font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Tailor / Boutique Atelier Image with 100% Fit & Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 scale-105 animate-pulse duration-[10000ms]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=1920&auto=format&fit=crop')`,
        }}
      />
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md z-0" />

      {/* Dynamic Ambient Aura Glows */}
      <div className="dynamic-aura-container pointer-events-none select-none z-0">
        <div className="aura-orb-1" />
        <div className="aura-orb-2" />
        <div className="aura-orb-3" />
        <div className="glass-grid-mesh" />
      </div>

      <div className="max-w-lg w-full relative z-10 space-y-6">
        {/* Welcome & Brand Greeting Animation Banner */}
        <div className="glass-panel-elevated rounded-3xl p-6 text-center space-y-3 border border-white/25 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>স্বাগতম পোর্টাল</span>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Welcome নাহার দর্জি বাড়ি
          </h1>
          
          <p className="text-amber-300 font-medium text-xs sm:text-sm italic">
            "✂️ ভালোবাসা, যত্ন ও নিখুঁত সেলাইয়ে আপনার আস্থার ঠিকানা।"
          </p>

          <div className="pt-2 border-t border-white/10 text-[11px] text-slate-300 space-y-0.5">
            <p className="font-semibold text-slate-200">Factory Address: Raj place, Rishipara, Padma mor, Hemayetpur, Dhaka, Bangladesh</p>
            <p className="text-emerald-400 font-medium">Powered by: Md Johurul Islam, IT Officer, Rupkatha Apparels Ltd.</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-panel-elevated rounded-3xl p-7 sm:p-8 relative z-10 text-xs shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/25">
          <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

          {/* Circular Logo Box with File Upload & Permanent Lock */}
          <div className="text-center space-y-3 mb-6">
            <div className="relative w-24 h-24 mx-auto group">
              <div className="w-full h-full rounded-full overflow-hidden bg-white/10 p-1 border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center justify-center">
                {brandSettings.logoUrl ? (
                  <img
                    src={brandSettings.logoUrl}
                    alt={brandSettings.brandName}
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="font-bold text-3xl text-emerald-400">ন</span>
                )}
              </div>

              {/* Choose File Overlay */}
              <label className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold">
                <Upload className="w-5 h-5 text-emerald-400 mb-0.5" />
                <span>{logoUploading ? 'Uploading...' : 'Choose File'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={logoUploading}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <h2 className="font-extrabold text-xl text-white tracking-tight">
                {brandSettings.brandName}
              </h2>
              <p className="text-slate-400 text-[11px] mt-0.5">Secure Role-Based Portal Access</p>
            </div>
          </div>

          {/* Role Selection Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-white/5 rounded-xl border border-white/10 mb-5">
            {(['Super Admin', 'Admin', 'User'] as const).map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => {
                  setSelectedRole(role);
                  if (role === 'Super Admin') setUserId('admin@nahardorjibari.com');
                  else if (role === 'Admin') setUserId('manager@nahardorjibari.com');
                  else setUserId('staff@nahardorjibari.com');
                }}
                className={`py-2 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  selectedRole === role
                    ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                {selectedRole} User ID / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 glass-input rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono-numbers text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-3 py-2.5 glass-input rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono-numbers text-xs"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Configured securely by Admin panel credentials.</p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-slate-950 font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-300/40 text-xs"
            >
              <span>{isLoading ? 'Authenticating...' : `Sign In as ${selectedRole}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Footer Security Note */}
          <div className="mt-5 pt-4 border-t border-white/10 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secured & locked logo session for Rupkatha Apparels Ltd.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
