// src/components/panels/CurveDataTable.jsx
import { CategoryBadge } from './Predictor7DayPanel';

/**
 * Accessible tabular view for 24-hour hourly CPCB AQI data.
 * @param {object} props
 * @param {Array<{ hour: string, aqi: number, category: string, pm25?: number, pm10?: number }>} props.hours
 */
export default function CurveDataTable({ hours = [] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#CBD5E1] dark:border-[#334155] shadow-xs">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-300/80 dark:bg-slate-800 text-[11px] uppercase font-bold text-[#334155] dark:text-[#CBD5E1] border-b border-[#CBD5E1] dark:border-[#334155]">
          <tr>
            <th scope="col" className="px-4 py-2.5">
              Time
            </th>
            <th scope="col" className="px-4 py-2.5">
              Estimated NAQI
            </th>
            <th scope="col" className="px-4 py-2.5">
              CPCB Category
            </th>
            <th scope="col" className="px-4 py-2.5">
              PM2.5 (µg/m³)
            </th>
            <th scope="col" className="px-4 py-2.5">
              PM10 (µg/m³)
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#CBD5E1] dark:divide-[#334155] bg-[#E2E8F0] dark:bg-[#1E293B]">
          {hours.map((h, idx) => (
            <tr
              key={idx}
              className="hover:bg-slate-300/60 dark:hover:bg-slate-700/60 transition-colors"
            >
              <td className="px-4 py-2 font-mono font-bold text-[#334155] dark:text-[#CBD5E1]">
                {h.hour}
              </td>
              <td className="px-4 py-2 font-black text-sm text-[#334155] dark:text-[#F8FAFC]">
                {h.aqi}
              </td>
              <td className="px-4 py-2">
                <CategoryBadge aqi={h.aqi} categoryName={h.category} />
              </td>
              <td className="px-4 py-2 font-mono font-medium text-slate-700 dark:text-slate-300">
                {h.pm25 ?? '—'}
              </td>
              <td className="px-4 py-2 font-mono font-medium text-slate-700 dark:text-slate-300">
                {h.pm10 ?? '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
