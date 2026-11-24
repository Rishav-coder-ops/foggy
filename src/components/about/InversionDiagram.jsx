// src/components/about/InversionDiagram.jsx
import { Layers } from 'lucide-react';

export default function InversionDiagram() {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Layers className="w-4 h-4 text-sky-500" />
        <span>Diagram 1: Normal Atmospheric Dispersion vs Winter Thermal Inversion Lid</span>
      </h3>

      <div className="rounded-2xl p-4 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <svg
          viewBox="0 0 800 320"
          className="w-full min-w-[600px] h-auto select-none"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {/* Left Panel: Normal Day */}
          <rect
            x="10"
            y="10"
            width="380"
            height="300"
            rx="16"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="dark:fill-slate-900 dark:stroke-slate-800"
          />
          <text x="30" y="38" fontSize="14" fontWeight="bold" fill="#0284c7">
            NORMAL CONDITIONS (Unrestricted Dispersion)
          </text>

          {/* Normal Altitude temperature gradient */}
          <rect x="25" y="55" width="350" height="60" rx="8" fill="#e0f2fe" opacity="0.6" />
          <text x="35" y="80" fontSize="11" fontWeight="bold" fill="#0369a1">
            Cooler Upper Atmosphere (-10°C to 0°C)
          </text>
          <text x="35" y="100" fontSize="10" fill="#0284c7">
            Pollutants dilute and drift harmlessly away into the troposphere
          </text>

          <rect x="25" y="125" width="350" height="60" rx="8" fill="#fef3c7" opacity="0.6" />
          <text x="35" y="150" fontSize="11" fontWeight="bold" fill="#b45309">
            Mild Mixing Boundary Layer (15°C)
          </text>

          <rect x="25" y="195" width="350" height="90" rx="8" fill="#fed7aa" opacity="0.6" />
          <text x="35" y="220" fontSize="11" fontWeight="bold" fill="#c2410c">
            Warm Ground Surface Heated by Sun (25°C)
          </text>

          {/* Normal rising air arrows */}
          <path
            d="M 120 270 Q 120 180 150 80"
            stroke="#0284c7"
            strokeWidth="3"
            strokeDasharray="5,5"
            fill="none"
          />
          <polygon points="150,75 144,88 156,88" fill="#0284c7" />
          <text x="165" y="170" fontSize="11" fontWeight="bold" fill="#0284c7">
            ↑ Warm air rises freely
          </text>

          <path
            d="M 270 270 Q 270 180 300 80"
            stroke="#0284c7"
            strokeWidth="3"
            strokeDasharray="5,5"
            fill="none"
          />
          <polygon points="300,75 294,88 306,88" fill="#0284c7" />
          <text x="280" y="250" fontSize="10" fill="#64748b">
            Chimneys & exhaust vent upward
          </text>

          {/* Right Panel: Thermal Inversion */}
          <rect
            x="410"
            y="10"
            width="380"
            height="300"
            rx="16"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="dark:fill-slate-900 dark:stroke-slate-800"
          />
          <text x="430" y="38" fontSize="14" fontWeight="bold" fill="#e11d48">
            WINTER INVERSION (Smoke Trapped at Surface)
          </text>

          {/* Inversion layers */}
          <rect x="425" y="55" width="350" height="50" rx="8" fill="#e2e8f0" opacity="0.7" />
          <text x="435" y="80" fontSize="11" fontWeight="bold" fill="#475569">
            Cold Air Aloft (-5°C)
          </text>

          {/* Warm Inversion Lid */}
          <rect
            x="425"
            y="115"
            width="350"
            height="70"
            rx="8"
            fill="#fecdd3"
            stroke="#f43f5e"
            strokeWidth="1.5"
          />
          <text x="435" y="140" fontSize="12" fontWeight="bold" fill="#be123c">
            WARM INVERSION LID (20°C)
          </text>
          <text x="435" y="160" fontSize="10" fontWeight="semibold" fill="#9f1239">
            Acts as an atmospheric ceiling: Prevents any vertical airflow
          </text>

          {/* Stagnant Cold Smog Pool */}
          <rect
            x="425"
            y="195"
            width="350"
            height="90"
            rx="8"
            fill="#713f12"
            opacity="0.3"
            stroke="#854d0e"
            strokeWidth="1"
          />
          <text x="435" y="220" fontSize="11" fontWeight="bold" fill="#854d0e">
            Cold Trapped Ground Air (8°C – 12°C)
          </text>
          <text x="435" y="240" fontSize="10" fill="#78350f">
            PM2.5, PM10, NOx, CO, and soot trapped at breathing height
          </text>

          {/* Blocked arrows */}
          <path d="M 520 270 L 520 188" stroke="#e11d48" strokeWidth="3" fill="none" />
          <line x1="510" y1="188" x2="530" y2="188" stroke="#e11d48" strokeWidth="4" />
          <text x="535" y="260" fontSize="10" fontWeight="bold" fill="#e11d48">
            ✕ Cannot escape upward
          </text>

          <path d="M 670 270 L 670 188" stroke="#e11d48" strokeWidth="3" fill="none" />
          <line x1="660" y1="188" x2="680" y2="188" stroke="#e11d48" strokeWidth="4" />
          <text x="590" y="208" fontSize="10" fill="#be123c">
            Hazardous Smog Pool
          </text>
        </svg>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
        In North & East India (Punjab, Delhi, Haryana, UP, Bihar, West Bengal), night radiation
        rapidly cools the ground. Stagnant cold air sits trapped below a warmer descending lid,
        concentrating vehicular soot and parali smoke to Severe levels (AQI 400+).
      </p>
    </div>
  );
}
