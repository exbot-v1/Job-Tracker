import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Film, Lock, Mail, User, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabase';

export const AuthView: React.FC = () => {
  const { loginWithSupabase, signupWithSupabase, isLoadingAuth } = useApp();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    if (!isSupabaseConfigured) {
      setErrorMsg('Authentication is currently unavailable. Please check the application\'s Supabase configuration (VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY).');
      return;
    }

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please provide both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    if (isSignUp) {
      const res = await signupWithSupabase(email.trim(), password, name.trim());
      if (res.error) {
        setErrorMsg(res.error);
      } else if (res.message) {
        setSuccessNotice(res.message);
      }
    } else {
      const res = await loginWithSupabase(email.trim(), password);
      if (res.error) {
        // Standardized secure error response
        if (res.error.toLowerCase().includes('invalid login credentials') || res.error.toLowerCase().includes('invalid grant')) {
          setErrorMsg('Invalid email or password.');
        } else {
          setErrorMsg(res.error);
        }
      }
    }
  };

  return (
    <div
      id="auth-view"
      className="min-h-screen w-full flex items-center justify-center p-4 bg-[#0F1115] text-[#E2E8F0] relative overflow-hidden antialiased selection:bg-emerald-500 selection:text-slate-950"
    >
      {/* Subtle Ambient Glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-[#161920] border border-[#262B36] rounded-2xl p-8 shadow-2xl relative z-10">
        {/* Logo & Header */}
        <div className="text-center mb-7">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 mx-auto mb-4 font-bold">
            <Film className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            Video Contract Tracker
          </h1>
          <p className="text-xs text-[#94A3B8] mt-1">
            Production Dashboard for Video Editing Runtime &amp; Payment Milestones
          </p>
        </div>

        {/* Supabase configuration notice if missing */}
        {!isSupabaseConfigured && (
          <div className="p-3.5 mb-5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Supabase Configuration Required</p>
              <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                Please configure <code className="font-mono bg-amber-950/40 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="font-mono bg-amber-950/40 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> to enable live authentication and database persistence.
              </p>
            </div>
          </div>
        )}

        {/* Error message banner */}
        {errorMsg && (
          <div className="p-3 mb-5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Success message banner */}
        {successNotice && (
          <div className="p-3 mb-5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
            {successNotice}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Sharif Ahmed"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#0F1115] border border-[#262B36] rounded-xl text-sm text-slate-100 placeholder-[#64748B] focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <User className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                placeholder="editor@yourdomain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#0F1115] border border-[#262B36] rounded-xl text-sm text-slate-100 placeholder-[#64748B] focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Mail className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#94A3B8] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-[#0F1115] border border-[#262B36] rounded-xl text-sm text-slate-100 placeholder-[#64748B] focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <Lock className="w-4 h-4 text-[#64748B] absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoadingAuth}
            className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            <span>
              {isLoadingAuth
                ? 'Authenticating...'
                : isSignUp
                ? 'Create Supabase Account'
                : 'Sign In to Dashboard'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle sign up / sign in */}
        <div className="mt-6 pt-5 border-t border-[#262B36] text-center">
          <div className="flex justify-between items-center text-xs text-[#94A3B8]">
            <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
                setSuccessNotice('');
              }}
              className="text-emerald-400 font-semibold hover:underline"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Supabase Auth • PostgreSQL Row Level Security</span>
        </div>
      </div>
    </div>
  );
};
