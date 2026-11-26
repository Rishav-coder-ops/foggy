// src/components/panels/Curve24hPanel.jsx
// 24-Hour AQI Curve Feature Box & Expanded Modal using CPCB National AQI (0-500)
import { useState, useRef, useId } from 'react';
import { Wind, Table, BarChart2, CheckCircle2, Clock } from 'lucide-react';
import ExpandablePanelModal from '../ExpandablePanelModal';
import PanelCitySearch from '../PanelCitySearch';
import { CategoryBadge } from './Predictor7DayPanel';
import { getAQICategory } from '../../../functions/api/aqi-timeline.js';
import Sparkline24h from './Sparkline24h';
import CurveDataTable from './CurveDataTable';
import CurveChartSVG from './CurveChartSVG';

export default function Curve24hPanel({
  timelineData,
  _loading = false,
  location,
  onCitySelect,
  onUseMyLocation,
  geoLoading = false,
  geoError = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewTable, setViewTable] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const cardRef = useRef(null);
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
  const scaleY = (val) =>
    paddingTop + plotHeight - (Math.min(val, maxScale) / maxScale) * plotHeight;

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

  const pathD =
    points.length > 0
      ? `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
      : '';
  const areaD =
    points.length > 0
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
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
              <Wind className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              Hourly Trend
            </span>
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              24-Hour AQI Curve
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
              Track the diurnal smog cycle and identify the afternoon inversion dip for safer
              commutes and daily routines.
            </p>
          </div>

          {/* Mini Sparkline Visualization */}
          <div className="pt-2">
            <Sparkline24h data={hours} currentAqi={currentAqi} />
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400">
          <span>Click to expand 24h curve</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </div>
      </div>

      {/* Expanded Modal */}
      <ExpandablePanelModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="24-Hour Air Quality Diurnal Curve"
        subtitle={`Diurnal inversion cycle & safest outdoor windows for ${location?.name || 'Kolkata'}`}
        badgeText="24h Hourly Trend"
        badgeVariant="amber"
        icon={Wind}
      >
        {/* City Autocomplete Switcher inside modal */}
        <PanelCitySearch
          currentCityName={location?.name || 'Kolkata'}
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
          <CurveChartSVG
            svgWidth={svgWidth}
            svgHeight={svgHeight}
            chartId={chartId}
            bands={bands}
            scaleY={scaleY}
            paddingLeft={paddingLeft}
            plotWidth={plotWidth}
            paddingTop={paddingTop}
            plotHeight={plotHeight}
            areaD={areaD}
            pathD={pathD}
            points={points}
            hoveredPoint={hoveredPoint}
            setHoveredPoint={setHoveredPoint}
          />
        ) : (
          <CurveDataTable hours={hours} />
        )}

        {/* Attribution & Disclaimer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
          <p>
            <strong className="text-slate-800 dark:text-slate-200">Attribution:</strong> Air quality
            data: Open-Meteo.com, based on Copernicus Atmosphere Monitoring Service (CAMS) model
            data.
          </p>
          <p className="italic">
            <strong>Disclaimer:</strong> Estimated from modelled data; official CPCB station
            readings may differ. Check the official CPCB bulletin or the SAMEER app for
            authoritative values.
          </p>
        </div>
      </ExpandablePanelModal>
    </>
  );
}
