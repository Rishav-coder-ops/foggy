// src/components/panels/CurveChartSVG.jsx

/**
 * Renders the 24-hour SVG Area Chart with CPCB National AQI Bands and interactive focus points.
 * @param {object} props
 */
export default function CurveChartSVG({
  svgWidth,
  svgHeight,
  chartId,
  bands,
  scaleY,
  paddingLeft,
  plotWidth,
  paddingTop,
  plotHeight,
  areaD,
  pathD,
  points,
  hoveredPoint,
  setHoveredPoint
}) {
  return (
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
            <g
              transform={`translate(${Math.min(svgWidth - 170, Math.max(60, hoveredPoint.x - 75))}, ${Math.max(10, hoveredPoint.y - 70)})`}
            >
              <rect width="150" height="58" rx="10" fill="#0F172A" className="drop-shadow-lg" />
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
  );
}
