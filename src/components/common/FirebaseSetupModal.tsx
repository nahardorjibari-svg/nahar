import React, { useState } from 'react';
import { X, CheckCircle, Database, Shield, Key, ExternalLink, HelpCircle, AlertCircle, Copy, Check } from 'lucide-react';
import {
  getStoredFirebaseConfig,
  saveFirebaseConfig,
  clearFirebaseConfig,
  testFirestoreConnection,
} from '../../services/firebaseConfig';
import { FirebaseConnectionConfig } from '../../types';

interface FirebaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const FirebaseSetupModal: React.FC<FirebaseSetupModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved,
}) => {
  const currentConfig = getStoredFirebaseConfig();
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'data-viewer' | 'guide' | 'rules'>('settings');
  const [copiedRules, setCopiedRules] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!projectId.trim() || !apiKey.trim()) {
      alert('Please provide at least a Project ID and Web API Key.');
      return;
    }

    const config: Omit<FirebaseConnectionConfig, 'isConfigured'> = {
      projectId: projectId.trim(),
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim() || `${projectId.trim()}.firebaseapp.com`,
      storageBucket: storageBucket.trim() || `${projectId.trim()}.appspot.com`,
      appId: appId.trim(),
    };

    saveFirebaseConfig(config);
    onConfigSaved();
    alert('Firebase configuration saved! The application will now use Cloud Firestore.');
    onClose();
  };

  const handleDisconnect = () => {
    if (window.confirm('Disconnect Firebase and revert to local demo storage?')) {
      clearFirebaseConfig();
      setProjectId('');
      setApiKey('');
      setAuthDomain('');
      setStorageBucket('');
      setAppId('');
      setTestResult(null);
      onConfigSaved();
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testFirestoreConnection();
    setTestResult(res);
    setTesting(false);
  };

  const sampleRules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /products/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /stock_movements/{id} {
      allow read, write: if request.auth != null;
    }
    match /brand_settings/{id} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`;

  const copyRules = () => {
    navigator.clipboard.writeText(sampleRules);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">Firebase Cloud Infrastructure Setup</h3>
              <p className="text-xs text-slate-500">Configure Cloud Firestore, Authentication & Storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 px-6 bg-white gap-6">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'settings'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Connection Credentials
          </button>
          <button
            onClick={() => setActiveTab('data-viewer')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'data-viewer'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            ডাটা দেখার নিয়ম (View Data)
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Required Firebase Project Settings
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-3 text-xs font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'rules'
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Security Rules (firestore.rules)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex gap-2.5">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Zero-Friction Cloud Persistence:</span> Enter your Web App configuration keys from the Firebase Console (Project Settings &gt; General &gt; Your apps). Data will be saved in real time to your Cloud Firestore.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Project ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. nahar-dorjibari-app"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-400">Lowercase letters, numbers, and dashes.</span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Web API Key <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="AIzaSy..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Auth Domain (Optional)</label>
                  <input
                    type="text"
                    placeholder="nahar-dorjibari-app.firebaseapp.com"
                    value={authDomain}
                    onChange={(e) => setAuthDomain(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Storage Bucket (Optional)</label>
                  <input
                    type="text"
                    placeholder="nahar-dorjibari-app.appspot.com"
                    value={storageBucket}
                    onChange={(e) => setStorageBucket(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1">App ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="1:1234567890:web:abcdef..."
                    value={appId}
                    onChange={(e) => setAppId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono text-xs"
                  />
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-3 rounded-lg border flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'data-viewer' && (
            <div className="space-y-4 text-slate-700">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    <span>Firebase এ সেভ হওয়া ডাটা দেখার সহজ উপায়</span>
                  </h4>
                  {projectId && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-mono px-2 py-0.5 rounded border border-emerald-300">
                      Project: {projectId}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  আপনার সফটওয়্যার থেকে পণ্য, অর্ডার, ডেলিভারি ও খরচ সরাসরি গুগল ফায়ারবেস ক্লাউড ফায়ারস্টোরে (Cloud Firestore) রিয়েল-টাইমে জমা হয়।
                </p>
                <div className="pt-2">
                  <a
                    href={
                      projectId
                        ? `https://console.firebase.google.com/project/${projectId}/firestore/databases/-default-/data`
                        : 'https://console.firebase.google.com'
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow transition-all cursor-pointer"
                  >
                    <span>ফায়ারবেস কনসোলে লাইভ ডাটা দেখুন (Open Firestore Console)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold text-slate-900 text-xs">ফায়ারবেসে আপনার ডাটা যে যে ফোল্ডারে (Collections) জমা হয়:</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-slate-900 font-mono block">📁 products</strong>
                    <span className="text-slate-600">সকল ৩-পিস পণ্যের বিবরণ, স্টক সংখ্যা, পাইকারি খরচ ও ছবি।</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-slate-900 font-mono block">📁 orders</strong>
                    <span className="text-slate-600">সকল বিক্রয় চালান, কাস্টমার তথ্য, পেমেন্ট ও ইনভয়েস নম্বর।</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-slate-900 font-mono block">📁 expenses</strong>
                    <span className="text-slate-600">প্রতিদিনের প্যাকেজিং, বুস্টিং, চা-নাস্তা ও ডেলিভারি খরচের ভাউচার।</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-slate-900 font-mono block">📁 customers</strong>
                    <span className="text-slate-600">গ্রাহকদের নাম, ফোন নম্বর, ঠিকানা ও মোট কত টাকার পণ্য কিনেছেন।</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-slate-900 font-mono block">📁 stock_movements</strong>
                    <span className="text-slate-600">স্টক যোগ, বিক্রয় বা রিটার্নের প্রতি মুহূর্তের অডিট হিস্টোরি।</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                    <strong className="text-slate-900 font-mono block">📁 brand_settings</strong>
                    <span className="text-slate-600">নাহার দর্জি বাড়ি ব্র্যান্ড সেটিংস, ঠিকানা ও ইনভয়েস নোট।</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] space-y-1">
                <strong>💡 কিভাবে বুঝবেন ডাটা ঠিকভাবে সেভ হচ্ছে?</strong>
                <p>
                  ১. অ্যাপের একদম ওপরে দেখুন <strong>"Cloud Firestore Live"</strong> সবুজ বাতি জ্বলছে কি না।<br />
                  ২. এই পপআপের নিচে <strong>"Test Connection"</strong> বাটনে চাপ দিন — সফল হলে সবুজ চেকমার্ক আসবে।<br />
                  ৩. অন্য যেকোনো মোবাইল বা কম্পিউটার দিয়ে এই সাইটে লগইন করলেও সব ডাটা স্বয়ংক্রিয়ভাবে চলে আসবে।
                </p>
              </div>
            </div>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-3 text-slate-700">
              <h4 className="font-semibold text-slate-900 text-xs">Required Firebase Project Settings:</h4>
              <ol className="list-decimal pl-4 space-y-2.5 leading-relaxed">
                <li>
                  <strong className="text-slate-900">Create a Project:</strong> Visit{' '}
                  <a
                    href="https://console.firebase.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    Firebase Console <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  and click <em>Add Project</em> (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded">nahar-dorjibari</code>).
                </li>
                <li>
                  <strong className="text-slate-900">Provision Cloud Firestore:</strong> Go to <em>Build &gt; Firestore Database</em>. Choose Production or Test mode, and select region <code className="bg-slate-100 px-1 py-0.5 rounded">asia-south1 (Mumbai)</code> or nearest South Asian zone for lowest latency from Dhaka.
                </li>
                <li>
                  <strong className="text-slate-900">Firebase Authentication:</strong> Go to <em>Build &gt; Authentication &gt; Sign-in method</em>. Enable <strong>Google Provider</strong> and <strong>Email/Password</strong>. Add your domain to Authorized Domains.
                </li>
                <li>
                  <strong className="text-slate-900">Firebase Storage:</strong> Go to <em>Build &gt; Storage</em> to enable high-resolution product photography upload bucket for 3-piece outfits.
                </li>
                <li>
                  <strong className="text-slate-900">Register Web App:</strong> Under <em>Project Settings &gt; General &gt; Your apps</em>, click the Web icon (<code className="bg-slate-100 px-1 py-0.5 rounded">&lt;/&gt;</code>) to obtain the configuration values.
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 text-xs">Production firestore.rules:</span>
                <button
                  onClick={copyRules}
                  className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 px-2 py-1 rounded border border-slate-200 cursor-pointer"
                >
                  {copiedRules ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  {copiedRules ? 'Copied' : 'Copy Rules'}
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto leading-relaxed">
                {sampleRules}
              </pre>
              <p className="text-[11px] text-slate-500">
                Paste these into your Firebase Console under Firestore Database &gt; Rules tab to ensure secure read/write protection.
              </p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentConfig?.isConfigured && (
              <button
                onClick={handleDisconnect}
                className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer"
              >
                Disconnect & Use Demo Mode
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTest}
              disabled={testing || !projectId}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Save & Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
