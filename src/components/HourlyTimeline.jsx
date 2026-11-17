// src/components/HourlyTimeline.jsx
import React, { useState } from 'react';
import { Clock, Sun, AlertOctagon, CheckCircle2 } from 'lucide-react';

export default function HourlyTimeline({ hourlyData = [] }) {
  const [selectedHour, setSelectedHour] = useState(null);

  if (!hourlyData || hourlyData.length === 0) {
    return null;
  }

  const activeHour = selectedHour || hourlyData[0];

  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-soft dark:shadow-soft-dark">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5" />
            <span>24-Hour Smog Inversion Curve</span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">
            Best vs. Worst Outdoor Activity Windows
          </h3>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            Optimal Window
          </span>
          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            Peak Inversion
          </span>
        </div>
      </div>

      {/* Hourly Scrollable Strip */}
      <div className="overflow-x-auto pb-3 pt-2">
        <div className="flex gap-2 min-w-[700px]">
          {hourlyData.slice(0, 16).map((item, index) => {
            const isSelected = activeHour?.time === item.time;
            const aqiColor =
              item.aqi <= 50 ? 'bg-emerald-500' :
              item.aqi <= 100 ? 'bg-amber-400' :
              item.aqi <= 150 ? 'bg-orange-500' :
              item.aqi <= 200 ? 'bg-red-500' : 'bg-purple-600';

            return (
              <button
                key={index}
                type="button"
                onClick={() => setSelectedHour(item)}
                className={`flex-1 p-2.5 rounded-2xl flex flex-col items-center justify-between transition-all border text-center ${
                  isSelected
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 shadow-md ring-2 ring-sky-400/40'
                    : 'border-slate-200/70 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${item.isBestWindow ? 'ring-1 ring-emerald-500/50' : ''}`}
              >
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {item.time}
                </span>

                <div className="my-2 flex flex-col items-center gap-1">
                  <div
                    className={`w-3 h-3 rounded-full ${aqiColor} shadow-xs`}
                    title={`AQI ${item.aqi}`}
                  ></div>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {item.aqi}
                  </span>
                </div>

                {item.isBestWindow ? (
                  <span className="inline-block text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-full">
                    Best Window
                  </span>
                ) : item.isPeakWindow ? (
                  <span className="inline-block text-[9px] font-bold text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/80 px-1.5 py-0.5 rounded-full">
                    Peak Smog
                  </span>
                ) : (
                  <span className="inline-block text-[9px] text-slate-600 dark:text-slate-400">
                    Moderate
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Hour Insight Banner */}
      {activeHour && (
        <div className="mt-3 p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            {activeHour.isBestWindow ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : activeHour.isPeakWindow ? (
              <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />
            ) : (
              <Sun className="w-5 h-5 text-amber-500 shrink-0" />
            )}
            <div>
              <span className="font-bold text-slate-800 dark:text-white mr-1.5">
                {activeHour.time} Status:
              </span>
              <span className="text-slate-600 dark:text-slate-300">
                {activeHour.recommendation} (Estimated AQI: <strong>{activeHour.aqi}</strong>)
              </span>
            </div>
          </div>
          <span className="text-[11px] text-slate-600 dark:text-slate-400 hidden sm:inline">
            Click any hour to preview guidance
          </span>
        </div>
      )}
    </div>
  );
}
