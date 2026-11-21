// src/components/MobileBottomNav.jsx
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Search, Shield, Users, Info } from 'lucide-react';

export default function MobileBottomNav() {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/search', label: 'Search', icon: Search },
    { to: '/indoor-hacks', label: 'Hacks', icon: Shield },
    { to: '/family', label: 'Family', icon: Users },
    { to: '/about', label: 'About', icon: Info }
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/80 dark:border-slate-800 transition-colors shadow-lg pb-safe"
      aria-label="Mobile Navigation"
    >
      <div className="max-w-md mx-auto px-2 h-16 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center flex-1 py-1 rounded-xl text-[10px] font-bold transition-all ${
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
    </nav>
  );
}
