// src/components/panels/Curve24hPanel.jsx
// 24-Hour AQI Curve Feature Box & Expanded Modal using CPCB National AQI (0-500)
import React, { useState, useRef, useId } from 'react';
import { Wind, Table, BarChart2, CheckCircle2, Clock } from 'lucide-react';
import ExpandablePanelModal from '../ExpandablePanelModal';
import PanelCitySearch from '../PanelCitySearch';
import { CategoryBadge } from './Predictor7DayPanel';
import { getAQICategory } from '../../../functions/api/aqi-timeline.js';

export function Sparkline24h({ data = [], currentAqi = 165, height = 36, width = 160 }) {
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

export default function Curve24hPanel({
  timelineData,
  loading = false,
  location,
  onCitySelect,
  onUseMyLocation,
  geoLoading = false,
  geoError = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewTable, setViewTable] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const cardRef = React.useRef(null);
  const chartId = useId();

  const hours = timelineData?.last24Hours || [];
  const currentAqi = timelineData?.currentAqi || (hours[hours.length - 1]?.aqi ?? 165);
  const currentCat = getAQICategory(currentAqi);

  // SVG dimensions
  const svgWidth = 800;
  const svgHeight = 300;
  const paddingLeft = 55;
  const paddingRight = 150;
  const paddingTop = 25;
  const paddingBottom = 40;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  // CPCB 0-500 scale
  const maxScale = 500;
  const scaleY = (val) => paddingTop + plotHeight - (Math.min(val, maxScale) / maxScale) * plotHeight;

  // 6 official CPCB National AQI Bands
  const bands = [
    { label: 'Severe (401-500)', min: 401, max: 500, color: '#881337' },
    { label: 'Very Poor (301-400)', min: 301, max: 400, color: '#EF4444' },
    { label: 'Poor (201-300)', min: 201, max: 300, color: '#F97316' },
    { label: 'Moderate (101-200)', min: 101, max: 200, color: '#EAB308' },
    { label: 'Satisfactory (51-100)', min: 51, max: 100, color: '#22C55E' },
    { label: 'Good (0-50)', min: 0, max: 50, color: '#10B981' }
  ];

  const points = hours.map((h, i) => {
    const x = paddingLeft + (i / Math.max(1, hours.length - 1)) * plotWidth;
    const y = scaleY(h.aqi);
    return { ...h, x, y };
  });

  const pathD = points.length > 0 ? `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}` : '';
  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x},${paddingTop + plotHeight} L ${points[0].x},${paddingTop + plotHeight} Z`
    : '';

  return (
    <>
      {/* Landing Page Feature Box (Middle Box) - Alive with hover, lift, glow, nudge & press feedback */}
      <div
        ref={cardRef}
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Open 24-Hour AQI Curve panel"
        className="interactive-card rounded-3xl p-6 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-soft dark:shadow-soft-dark space-y-3 cursor-pointer group hover:border-amber-400 dark:hover:border-amber-500/60 hover:shadow-glow-amber focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all duration-300 motion-safe:hover:-translate-y-1.5 motion-safe:active:scale-[0.98] flex flex-col justify-between"
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:rotate-3 shadow-xs">
              <Wind className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Hourly Inversion Forecast
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            24-Hour AQI Curve
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Live atmospheric inversion model tracks morning and evening smog peaks, pinpointing optimal midday exercise windows in {location?.name || 'Kolkata'}.
          </p>

          {/* Compact Sparkline Preview */}
          <div className="pt-1">
            <Sparkline24h data={hours} currentAqi={currentAqi} />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <span>Click to explore 24h curve</span>
          <span className="text-slate-400 group-hover:text-amber-500 transition-all duration-300 motion-safe:group-hover:translate-x-1.5">→</span>
        </div>
      </div>

      {/* Expanded Modal Sheet */}
      <ExpandablePanelModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="24-Hour AQI Curve & Thermal Inversion Analysis"
        subtitle={`Hourly atmospheric particulate progression in ${location?.name || 'Kolkata'} (CPCB NAQI)`}
        icon={Wind}
        triggerRef={cardRef}
        badge={
          timelineData?.isSample ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Simulation Mode
            </span>
          ) : (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Open-Meteo CAMS Model (Live)
            </span>
          )
        }
      >
        {/* City Search & Geolocation */}
        <PanelCitySearch
          currentLocation={location}
          onCitySelect={onCitySelect}
          onUseMyLocation={onUseMyLocation}
          geoLoading={geoLoading}
          geoError={geoError}
        />

        {/* Summary Metric Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] shadow-xs transition-transform duration-200 motion-safe:hover:-translate-y-0.5">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Current Air Quality
            </span>
            <div className="flex items-baseline justify-between gap-1.5 mt-1">
              <span className="text-2xl font-black text-[#334155] dark:text-[#F8FAFC]">
                {currentAqi}
              </span>
              <CategoryBadge aqi={currentAqi} categoryName={currentCat.name} />
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] shadow-xs transition-transform duration-200 motion-safe:hover:-translate-y-0.5">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              24h Mean Average
            </span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-[#334155] dark:text-[#F8FAFC]">
                {timelineData?.averageAqi24h ?? 172}
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">NAQI</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-100/90 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 shadow-xs transition-transform duration-200 motion-safe:hover:-translate-y-0.5">
            <span className="text-[10px] font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider block">
              Cleanest Window (Best)
            </span>
            <div className="flex items-baseline justify-between gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-950 dark:text-emerald-50">
                {timelineData?.bestHour24h?.hour || '14:00'}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-950 dark:bg-emerald-900/90 dark:text-emerald-200 border border-emerald-400 dark:border-emerald-700">
                NAQI {timelineData?.bestHour24h?.aqi ?? 110}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-rose-100/90 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-700 shadow-xs transition-transform duration-200 motion-safe:hover:-translate-y-0.5">
            <span className="text-[10px] font-bold text-rose-950 dark:text-rose-200 uppercase tracking-wider block">
              Peak Smog Window (Worst)
            </span>
            <div className="flex items-baseline justify-between gap-1.5 mt-1">
              <span className="text-2xl font-black text-rose-950 dark:text-rose-50">
                {timelineData?.worstHour24h?.hour || '08:00'}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-950 dark:bg-rose-900/90 dark:text-rose-200 border border-rose-400 dark:border-rose-700">
                NAQI {timelineData?.worstHour24h?.aqi ?? 245}
              </span>
            </div>
          </div>
        </div>

        {/* Cleanest Window Advice Callout */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-950 dark:text-emerald-200 font-medium">
            <strong className="font-bold">Routine Recommendation:</strong>{' '}
            {timelineData?.cleanestWindowTip ||
              'Plan outdoor walks, dog walking, and quick indoor airing for early afternoon when ground temperature breaks the nocturnal thermal inversion lid.'}
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-500" />
            <span>24-Hour Hourly Curve ({location?.name || 'Kolkata'} Local Time)</span>
          </span>
          <button
            type="button"
            onClick={() => setViewTable(!viewTable)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E2E8F0] dark:bg-[#1E293B] hover:bg-slate-300 dark:hover:bg-slate-700 text-[#334155] dark:text-[#CBD5E1] border border-[#CBD5E1] dark:border-[#334155] transition-colors cursor-pointer"
          >
            {viewTable ? <BarChart2 className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
            <span>{viewTable ? 'View as Chart' : 'View as Table'}</span>
          </button>
        </div>

        {/* Chart View or Table View */}
        {!viewTable ? (
          <div className="relative rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] p-4 overflow-hidden shadow-xs">
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full min-w-[640px] h-auto select-none overflow-visible"
                aria-label="24-hour AQI area chart with CPCB National AQI color bands"
              >
                <defs>
                  <linearGradient id={`${chartId}-area-grad`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#EAB308" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                  </linearGradient>
                </defs>

                {/* Shaded CPCB NAQI Bands with Colour + Text Labels */}
                {bands.map((b) => {
                  const yTop = scaleY(b.max);
                  const yBottom = scaleY(b.min);
                  const h = Math.max(2, yBottom - yTop);
                  return (
                    <g key={b.label}>
                      <rect
                        x={paddingLeft}
                        y={yTop}
                        width={plotWidth}
                        height={h}
                        fill={b.color}
                        fillOpacity="0.12"
                      />
                      <line
                        x1={paddingLeft}
                        y1={yTop}
                        x2={paddingLeft + plotWidth}
                        y2={yTop}
                        stroke={b.color}
                        strokeOpacity="0.35"
                        strokeDasharray="3 3"
                      />
                      {/* Text label so data is never colour-only */}
                      <text
                        x={paddingLeft + plotWidth + 8}
                        y={yTop + h / 2 + 3}
                        fontSize="9.5"
                        fontWeight="700"
                        fill={b.color}
                        className="select-none"
                      >
                        {b.label}
                      </text>
                    </g>
                  );
                })}

                {/* Y-Axis Tick Labels with high contrast in both themes */}
                {[0, 50, 100, 200, 300, 400, 500].map((tick) => (
                  <text
                    key={tick}
                    x={paddingLeft - 8}
                    y={scaleY(tick) + 3}
                    textAnchor="end"
                    fontSize="10"
                    fontWeight="600"
                    fill="currentColor"
                    className="text-slate-700 dark:text-slate-300 font-mono"
                  >
                    {tick}
                  </text>
                ))}

                {/* Shaded Area & Line */}
                <path d={areaD} fill={`url(#${chartId}-area-grad)`} />
                <path d={pathD} fill="none" stroke="#D97706" strokeWidth="2.5" strokeLinecap="round" />

                {/* Hover Guideline when point active */}
                {hoveredPoint && (
                  <line
                    x1={hoveredPoint.x}
                    y1={paddingTop}
                    x2={hoveredPoint.x}
                    y2={paddingTop + plotHeight}
                    stroke="#38BDF8"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />
                )}

                {/* Interactive Points */}
                {points.map((p, idx) => {
                  const isHovered = hoveredPoint?.hour === p.hour;
                  return (
                    <g
                      key={idx}
                      tabIndex={0}
                      role="button"
                      aria-label={`Time: ${p.hour}, NAQI: ${p.aqi}, Category: ${p.category}`}
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onFocus={() => setHoveredPoint(p)}
                      onBlur={() => setHoveredPoint(null)}
                      className="cursor-pointer focus:outline-none"
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isHovered ? 6 : 3.5}
                        fill={p.color}
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 2.5 : 1.5}
                        className="transition-all"
                      />
                      {idx % 4 === 0 && (
                        <text
                          x={p.x}
                          y={paddingTop + plotHeight + 18}
                          textAnchor="middle"
                          fontSize="10"
                          fontWeight="700"
                          fill="currentColor"
                          className="text-slate-700 dark:text-slate-300 font-mono"
                        >
                          {p.hour}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Active Tooltip on chart */}
                {hoveredPoint && (
                  <g transform={`translate(${Math.min(svgWidth - 170, Math.max(60, hoveredPoint.x - 75))}, ${Math.max(10, hoveredPoint.y - 70)})`}>
                    <rect
                      width="150"
                      height="58"
                      rx="10"
                      fill="#0F172A"
                      className="drop-shadow-lg"
                    />
                    <text x="10" y="18" fill="#F8FAFC" fontSize="11" fontWeight="700">
                      {hoveredPoint.hour} • NAQI {hoveredPoint.aqi}
                    </text>
                    <text x="10" y="32" fill={hoveredPoint.color} fontSize="10" fontWeight="700">
                      {hoveredPoint.category}
                    </text>
                    <text x="10" y="47" fill="#CBD5E1" fontSize="9.5" fontWeight="600">
                      PM2.5: {hoveredPoint.pm25 ?? '—'} | PM10: {hoveredPoint.pm10 ?? '—'} µg/m³
                    </text>
                  </g>
                )}
              </svg>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 text-center mt-2 font-medium">
              Hover, tap, or focus points to view precise hourly CPCB NAQI & particulate levels.
            </p>
          </div>
        ) : (
          /* Accessible Data Table Alternative */
          <div className="overflow-x-auto rounded-2xl border border-[#CBD5E1] dark:border-[#334155] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-300/80 dark:bg-slate-800 text-[11px] uppercase font-bold text-[#334155] dark:text-[#CBD5E1] border-b border-[#CBD5E1] dark:border-[#334155]">
                <tr>
                  <th scope="col" className="px-4 py-2.5">Time</th>
                  <th scope="col" className="px-4 py-2.5">Estimated NAQI</th>
                  <th scope="col" className="px-4 py-2.5">CPCB Category</th>
                  <th scope="col" className="px-4 py-2.5">PM2.5 (µg/m³)</th>
                  <th scope="col" className="px-4 py-2.5">PM10 (µg/m³)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#CBD5E1] dark:divide-[#334155] bg-[#E2E8F0] dark:bg-[#1E293B]">
                {hours.map((h, idx) => (
                  <tr key={idx} className="hover:bg-slate-300/60 dark:hover:bg-slate-700/60 transition-colors">
                    <td className="px-4 py-2 font-mono font-bold text-[#334155] dark:text-[#CBD5E1]">{h.hour}</td>
                    <td className="px-4 py-2 font-black text-sm text-[#334155] dark:text-[#F8FAFC]">{h.aqi}</td>
                    <td className="px-4 py-2">
                      <CategoryBadge aqi={h.aqi} categoryName={h.category} />
                    </td>
                    <td className="px-4 py-2 font-mono font-medium text-slate-700 dark:text-slate-300">{h.pm25 ?? '—'}</td>
                    <td className="px-4 py-2 font-mono font-medium text-slate-700 dark:text-slate-300">{h.pm10 ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Attribution & Disclaimer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
          <p>
            <strong className="text-slate-800 dark:text-slate-200">Attribution:</strong> Air quality data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model data.
          </p>
          <p className="italic">
            <strong>Disclaimer:</strong> Estimated from modelled data; official CPCB station readings may differ. Check the official CPCB bulletin or the SAMEER app for authoritative values.
          </p>
        </div>
      </ExpandablePanelModal>
    </>
  );
}
