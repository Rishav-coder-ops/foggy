// src/components/panels/Sparkline24h.jsx
import { getAQICategory } from '../../../functions/api/aqi-timeline.js';

/**
 * 24-Hour Sparkline component showing mini trend curve and current AQI status.
 * @param {object} props
 * @param {Array<{ aqi?: number }>} [props.data]
 * @param {number} [props.currentAqi=165]
 * @param {number} [props.height=36]
 * @param {number} [props.width=160]
 */
export default function Sparkline24h({ data = [], currentAqi = 165, height = 36, width = 160 }) {
  if (!data || data.length === 0) {
    return <div className="h-9 w-32 bg-[#E2E8F0] dark:bg-[#1E293B] rounded animate-pulse" />;
  }

  const aqis = data.map((d) => d.aqi ?? 150);
  const min = Math.min(...aqis, 0);
  const max = Math.max(...aqis, 400);
  const range = max - min || 1;

  const points = aqis.map((val, idx) => {
    const x = (idx / (aqis.length - 1)) * (width - 4) + 2;
    const y = height - 4 - ((val - min) / range) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathStr = `M ${points.join(' L ')}`;
  const areaStr = `${pathStr} L ${width - 2},${height} L 2,${height} Z`;

  const cat = getAQICategory(currentAqi);

  return (
    <div className="flex items-center gap-3">
      <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
        <defs>
          <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={cat.color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={cat.color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <path d={areaStr} fill="url(#sparkline-grad)" />
        <path d={pathStr} fill="none" stroke={cat.color} strokeWidth="2.5" strokeLinecap="round" />
        <circle
          cx={width - 2}
          cy={height - 4 - ((currentAqi - min) / range) * (height - 8)}
          r="3.5"
          fill={cat.color}
          className="animate-ping opacity-75"
        />
        <circle
          cx={width - 2}
          cy={height - 4 - ((currentAqi - min) / range) * (height - 8)}
          r="3"
          fill={cat.color}
        />
      </svg>
      <div className="flex flex-col">
        <span className="text-xs font-black leading-none text-[#334155] dark:text-[#F8FAFC]">
          NAQI {currentAqi}
        </span>
        <span className="text-[10px] font-bold mt-0.5" style={{ color: cat.color }}>
          {cat.name}
        </span>
      </div>
    </div>
  );
}
