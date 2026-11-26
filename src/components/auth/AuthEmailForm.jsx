// src/components/auth/AuthEmailForm.jsx
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function AuthEmailForm({
  isSignUp,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
  loading,
  onForgotPassword
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {isSignUp && (
        <div>
          <label
            htmlFor="authName"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
          >
            Full Name
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="authName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rajesh Sharma"
              autoComplete="name"
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
            />
          </div>
        </div>
      )}

      <div>
        <label
          htmlFor="authEmail"
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
        >
          Email Address
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="authEmail"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={(e) => setEmail(e.target.value.trim())}
            placeholder="name@example.com"
            autoComplete="email"
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label
            htmlFor="authPassword"
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Password
          </label>
          {!isSignUp && (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
            >
              Forgot password?
            </button>
          )}
        </div>
        <div className="relative">
          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="authPassword"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? 'Password (minimum 6 characters)' : '••••••••'}
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-md flex items-center justify-center gap-2 transition-all focus:outline-none focus:ring-2 focus:ring-sky-400 cursor-pointer disabled:opacity-50"
      >
        <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </form>
  );
}
