// src/components/auth/AuthTabs.jsx
export default function AuthTabs({ isSignUp, onTabChange }) {
  return (
    <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold mb-6">
      <button
        type="button"
        onClick={() => onTabChange(false)}
        className={`py-2 rounded-xl transition-all cursor-pointer ${
          !isSignUp
            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Sign In
      </button>
      <button
        type="button"
        onClick={() => onTabChange(true)}
        className={`py-2 rounded-xl transition-all cursor-pointer ${
          isSignUp
            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Sign Up
      </button>
    </div>
  );
}
