// src/components/about/AboutAqiSection.jsx
import { BookOpen, Terminal } from 'lucide-react';
import { CPCB_TABLE } from '../../constants/about/aboutData';
import AqiPollutantsGrid from './AqiPollutantsGrid';

export default function AboutAqiSection() {
  return (
    <section className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark space-y-6">
      <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
        <BookOpen className="w-4 h-4" />
        <span>Section 1: What is National AQI (CPCB NAQI)?</span>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white">
          How the Central Pollution Control Board Calculates Air Quality
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The <strong>National Air Quality Index (NAQI)</strong> is a standardized &ldquo;One
          Number-One Colour-One Description&rdquo; index introduced by the Ministry of Environment,
          Forest and Climate Change (MoEFCC) and the Central Pollution Control Board (CPCB) in 2014.
          It transforms complex atmospheric concentration data of multiple pollutants into a simple{' '}
          <strong>0 to 500</strong> integer scale.
        </p>

        {/* Sub-index computation formula explanation */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs space-y-2">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-sky-500" />
            <span>CPCB Linear Interpolation Sub-Index Formula</span>
          </h3>
          <p className="text-slate-600 dark:text-slate-300">
            For each pollutant, an individual sub-index{' '}
            <em>
              I<sub>p</sub>
            </em>{' '}
            is calculated using segmented linear interpolation between official breakpoint ranges:
          </p>
          <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-sky-700 dark:text-sky-300 text-center font-bold">
            I<sub>p</sub> = I<sub>low</sub> + [ (I<sub>high</sub> - I<sub>low</sub>) / (B
            <sub>high</sub> - B<sub>low</sub>) ] × (C<sub>p</sub> - B<sub>low</sub>)
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Where{' '}
            <em>
              C<sub>p</sub>
            </em>{' '}
            is the 24-hour rolling average concentration, [
            <em>
              B<sub>low</sub>
            </em>
            ,{' '}
            <em>
              B<sub>high</sub>
            </em>
            ] are the concentration breakpoints, and [
            <em>
              I<sub>low</sub>
            </em>
            ,{' '}
            <em>
              I<sub>high</sub>
            </em>
            ] are the index breakpoints. The overall <strong>National AQI</strong> is determined by
            the <strong>maximum sub-index</strong> among all monitored pollutants (the
            &ldquo;dominant pollutant&rdquo;), provided at least three pollutants are recorded
            including either PM2.5 or PM10.
          </p>
        </div>

        {/* CPCB Categories Table */}
        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <th className="py-2.5 px-3 font-bold">NAQI Range</th>
                <th className="py-2.5 px-3 font-bold">Category</th>
                <th className="py-2.5 px-3 font-bold">Official CPCB Health Impact Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {CPCB_TABLE.map((row, i) => (
                <tr key={i}>
                  <td className="py-3 px-3 font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${row.color}`}></span>
                    <span>{row.range}</span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-200">
                    {row.status}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 leading-relaxed">
                    {row.text}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AqiPollutantsGrid />
      </div>
    </section>
  );
}
