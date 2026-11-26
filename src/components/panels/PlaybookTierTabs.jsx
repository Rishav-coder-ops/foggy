// src/components/panels/PlaybookTierTabs.jsx

/**
 * 3-tier tab selector for the Playbook modal (Free, Budget, Premium).
 */
export default function PlaybookTierTabs({ activeTab, onSelectTab }) {
  const tabs = [
    {
      id: 'free',
      label: 'Free (₹0)',
      activeClass:
        'bg-white dark:bg-slate-900 text-emerald-800 dark:text-emerald-300 shadow-sm border border-slate-200 dark:border-slate-800'
    },
    {
      id: 'budget',
      label: 'Budget (< ₹1,000)',
      activeClass:
        'bg-white dark:bg-slate-900 text-amber-800 dark:text-amber-300 shadow-sm border border-slate-200 dark:border-slate-800'
    },
    {
      id: 'premium',
      label: 'Premium (₹1,000+)',
      activeClass:
        'bg-white dark:bg-slate-900 text-purple-800 dark:text-purple-300 shadow-sm border border-slate-200 dark:border-slate-800'
    }
  ];

  return (
    <div className="grid grid-cols-3 p-1 rounded-2xl bg-[#CBD5E1]/60 dark:bg-[#1E293B] text-xs font-bold border border-[#CBD5E1] dark:border-[#334155]">
      {tabs.map((tab) => {
        const isCurrent = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              isCurrent
                ? tab.activeClass
                : 'text-[#334155] dark:text-[#CBD5E1] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
