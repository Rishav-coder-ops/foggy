// src/components/MobileBottomNav.jsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Shield, Users, Brain } from 'lucide-react';
import MascotAvatar from './MascotAvatar';
import { useChat } from '../context/ChatContext';

export default function MobileBottomNav() {
  const { openChat, isOpen } = useChat();
  const location = useLocation();

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/indoor-hacks', label: 'Hacks', icon: Shield },
    // Center is the elevated Foggy assistant button
    { to: '/family', label: 'Family', icon: Users },
    { to: '/memory', label: 'Memory', icon: Brain },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 transition-colors shadow-lg pb-safe"
      aria-label="Mobile Navigation"
    >
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between relative">
        {/* First two navigation tabs */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-14 py-1 rounded-xl text-[10px] font-bold transition-all ${
                    isActive
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/80 dark:bg-sky-950/50'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Center Raised Assistant Button for Instant Mobile Chat */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-5">
          <button
            type="button"
            onClick={openChat}
            className={`relative group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-tr from-sky-400 via-teal-300 to-amber-300 p-0.5 shadow-xl transition-all active:scale-95 focus:outline-none focus:ring-4 focus:ring-sky-400/40 ${
              isOpen ? 'ring-2 ring-sky-400 scale-95' : ''
            }`}
            aria-label="Chat with Foggy Assistant"
            title="Chat with Foggy"
          >
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden">
              <MascotAvatar size="md" className="pointer-events-none scale-95" />
            </div>

            {/* Pulse indicator */}
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500 border border-white dark:border-slate-900"></span>
            </span>
          </button>
        </div>

        {/* Last two navigation tabs */}
        <div className="flex items-center space-x-1 sm:space-x-3">
          {navItems.slice(2, 4).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center w-14 py-1 rounded-xl text-[10px] font-bold transition-all ${
                    isActive
                      ? 'text-sky-600 dark:text-sky-400 bg-sky-50/80 dark:bg-sky-950/50'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
