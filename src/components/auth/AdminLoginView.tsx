import React, { useState } from 'react';
import { Lock, Mail, Shield, ArrowRight, Sparkles } from 'lucide-react';
import { BrandSettings, UserSession } from '../../types';

interface AdminLoginViewProps {
  brandSettings: BrandSettings;
  onLoginSuccess: (user: UserSession) => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  brandSettings,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('nahardorjibari@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      onLoginSuccess({
        id: 'usr-admin-01',
        name: 'Super Admin',
        email: email.trim(),
        role: 'Super Admin',
        branch: brandSettings.branch || 'Dhaka Flagship Showroom',
        isAuthenticated: true,
      });
      setIsLoading(false);
    }, 400);
  };

  const handleDemoLogin = (role: 'Super Admin' | 'Store Manager' | 'Sales Executive') => {
    onLoginSuccess({
      id: `usr-${role.toLowerCase().replace(' ', '-')}`,
      name: role,
      email: role === 'Super Admin' ? 'nahardorjibari@gmail.com' : `${role.toLowerCase().replace(' ', '')}@nahardorjibari.com`,
      role,
      branch: brandSettings.branch || 'Dhaka Flagship Showroom',
      isAuthenticated: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#050811] flex flex-col justify-center items-center p-4 relative overflow-hidden text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Dynamic Ambient Background Aura */}
      <div className="dynamic-aura-container pointer-events-none select-none">
        <div className="aura-orb-1" />
        <div className="aura-orb-2" />
        <div className="aura-orb-3" />
        <div className="aura-orb-4" />
        <div className="glass-grid-mesh" />
      </div>

      <div className="max-w-md w-full glass-panel-elevated rounded-3xl p-8 relative z-10 text-xs shadow-[0_24px_70px_rgba(0,0,0,0.85)] border border-white/20">
        {/* Specular Top Shine */}
        <div className="absolute top-0 left-12 right-12 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />

        {/* Brand Lockup */}
        <div className="text-center space-y-3 mb-6">
          <div className="w-24 h-24 rounded-full mx-auto overflow-hidden bg-white/10 p-1 border-2 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center">
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
          <div>
            <h2 className="font-extrabold text-2xl text-white tracking-tight drop-shadow-sm">
              {brandSettings.brandName}
            </h2>
            <p className="text-emerald-400 text-xs font-semibold mt-1">Nahar Dorjibari · ৩-পিস ইনভেন্টরি ও সেলস পোর্টাল</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Admin Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 glass-input rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2.5 glass-input rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] border border-emerald-300/40"
          >
            <span>{isLoading ? 'Verifying...' : 'Sign In as Super Admin'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Fast Role Quick Select */}
        <div className="mt-6 pt-5 border-t border-white/10">
          <p className="text-slate-400 text-[11px] text-center mb-3">Or quick-access with simulated role:</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleDemoLogin('Super Admin')}
              className="p-2.5 glass-card hover:border-emerald-400/40 text-white rounded-xl text-[11px] font-semibold transition-all text-center cursor-pointer shadow-xs"
            >
              Super Admin
            </button>
            <button
              onClick={() => handleDemoLogin('Store Manager')}
              className="p-2.5 glass-card hover:border-sky-400/40 text-white rounded-xl text-[11px] font-semibold transition-all text-center cursor-pointer shadow-xs"
            >
              Store Manager
            </button>
            <button
              onClick={() => handleDemoLogin('Sales Executive')}
              className="p-2.5 glass-card hover:border-amber-400/40 text-white rounded-xl text-[11px] font-semibold transition-all text-center cursor-pointer shadow-xs"
            >
              Sales Staff
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
