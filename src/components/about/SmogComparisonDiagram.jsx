// src/components/about/SmogComparisonDiagram.jsx
import { Sparkles } from 'lucide-react';

export default function SmogComparisonDiagram() {
  return (
    <div className="space-y-3 pt-2">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-500" />
        <span>Diagram 2: Classical London-Type Winter Smog vs Photochemical Summer Smog</span>
      </h3>

      <div className="rounded-2xl p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <svg
          viewBox="0 0 800 240"
          className="w-full min-w-[600px] h-auto select-none"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* Left Box: Classical Winter Smog */}
          <rect
            x="15"
            y="15"
            width="370"
            height="210"
            rx="14"
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="dark:fill-slate-900 dark:stroke-slate-800"
          />
          <text
            x="35"
            y="45"
            fontSize="13"
            fontWeight="bold"
            fill="#0f172a"
            className="dark:fill-slate-100"
          >
            Classical (Reducing / Winter) Smog
          </text>
          <rect x="35" y="60" width="80" height="20" rx="4" fill="#64748b" />
          <text x="42" y="74" fontSize="10" fontWeight="bold" fill="#ffffff">
            SO2 + PM2.5
          </text>

          <text x="35" y="105" fontSize="11" fill="#334155" className="dark:fill-slate-300">
            • <strong>Conditions:</strong> Cold, humid riverine winters, thermal inversion
          </text>
          <text x="35" y="130" fontSize="11" fill="#334155" className="dark:fill-slate-300">
            • <strong>Chemistry:</strong> High humidity + SO2 + soot creates acidic aerosol
          </text>
          <text x="35" y="155" fontSize="11" fill="#334155" className="dark:fill-slate-300">
            • <strong>Timing:</strong> Severe at dawn (6:00 AM – 9:00 AM) and evening
          </text>
          <text x="35" y="180" fontSize="11" fill="#334155" className="dark:fill-slate-300">
            • <strong>Examples:</strong> Delhi, Kolkata, Kanpur, Patna winter smog
          </text>
          <text x="35" y="205" fontSize="11" fontWeight="bold" fill="#b91c1c">
            Primary Danger: Bronchial inflammation, coughing, COPD spikes
          </text>

          {/* Right Box: Photochemical Summer Smog */}
          <rect
            x="415"
            y="15"
            width="370"
            height="210"
            rx="14"
            fill="#f1f5f9"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="dark:fill-slate-900 dark:stroke-slate-800"
          />
          <text
            x="435"
            y="45"
            fontSize="13"
            fontWeight="bold"
            fill="#0f172a"
            className="dark:fill-slate-100"
          >
            Photochemical (Oxidizing / Summer) Smog
          </text>
          <rect x="435" y="60" width="80" height="20" rx="4" fill="#d97706" />
          <text x="442" y="74" fontSize="10" fontWeight="bold" fill="#ffffff">
            O3 + PAN + NOx
          </text>

          <text x="435" y="105" fontSize="11" fill="#334155" className="dark:fill-slate-300">
            • <strong>Conditions:</strong> Warm, sunny, dry, high UV solar radiation
          </text>
          <text x="435" y="130" fontSize="11" fill="#334155" className="dark:fill-slate-300">
            • <strong>Chemistry:</strong> Sunlight splits NOx + VOCs → Ground-level Ozone (O3)
          </text>
          <text x="435" y="155" fontSize="11" fill="#334155" className="dark:fill-slate-300">
            • <strong>Timing:</strong> Peaks in the afternoon (1:00 PM – 4:00 PM)
          </text>
          <text x="435" y="180" fontSize="11" fill="#334155" className="dark:fill-slate-300">
            • <strong>Examples:</strong> Mumbai, Chennai, Bengaluru, Delhi pre-monsoon
          </text>
          <text x="435" y="205" fontSize="11" fontWeight="bold" fill="#c2410c">
            Primary Danger: Deep alveolar oxidation, chest pain, eye burning
          </text>
        </svg>
      </div>
    </div>
  );
}
