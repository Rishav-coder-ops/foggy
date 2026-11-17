// src/components/Navbar.jsx
import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Shield, Users, Brain, Info, LogOut, LogIn, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import MascotAvatar from './MascotAvatar';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/indoor-hacks', label: 'Indoor Hacks', icon: Shield },
    { to: '/family', label: 'Family Profiles', icon: Users },
    { to: '/memory', label: 'What Foggy Knows', icon: Brain },
    { to: '/about', label: 'About & Science', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 focus:outline-none group"
          aria-label="Foggy Home"
        >
          <MascotAvatar size="md" className="group-hover:rotate-6 transition-transform" />
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-tight text-slate-800 dark:text-white flex items-center gap-1.5">
              Foggy
              <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300/60 dark:border-sky-800">
                AI
              </span>
            </span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 -mt-1 hidden sm:block">
              Smog & Clean Air Companion
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right Section: Theme Toggle & User Auth Menu */}
        <div className="flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="flex items-center gap-2.5 sm:gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <Link
                to="/memory"
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-sky-600 dark:hover:text-sky-400 group"
                title="View what Foggy knows about you"
              >
                <img
                  src={user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-sky-400/50 object-cover shadow-xs"
                />
                <span className="hidden sm:inline font-bold">
                  {user.name ? user.name.split(' ')[0] : 'User'}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-sky-500 dark:hover:bg-sky-400 dark:text-slate-950 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* Mobile menu hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-3 pb-6 space-y-1.5 shadow-lg">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {isAuthenticated ? (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full border border-sky-400/50"
                />
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {user.name}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
              <Link
                to="/auth"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In or Create Account</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
