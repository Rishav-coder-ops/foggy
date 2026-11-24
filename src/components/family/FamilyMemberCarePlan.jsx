// src/components/family/FamilyMemberCarePlan.jsx
import CarePlanDiurnalSlots from './CarePlanDiurnalSlots';
import CarePlanDosDonts from './CarePlanDosDonts';
import CarePlanMaskNotice from './CarePlanMaskNotice';

export default function FamilyMemberCarePlan({ member, carePlan, memberAqiData }) {
  return (
    <div className="mt-5 p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-750 space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80 dark:border-slate-700/80">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            Deterministic CPCB Protocol
          </span>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            Today&apos;s Care Plan for {member.name}
          </h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Based on CPCB NAQI:{' '}
          <strong className="text-slate-800 dark:text-slate-200">
            {carePlan.aqi} ({carePlan.category})
          </strong>
          {memberAqiData?.isMock && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
              (Simulated)
            </span>
          )}
        </span>
      </div>

      <CarePlanDiurnalSlots timeSlots={carePlan.timeSlots} />
      <CarePlanDosDonts doList={carePlan.doList} avoidList={carePlan.avoidList} />
      <CarePlanMaskNotice carePlan={carePlan} />
    </div>
  );
}
