// src/components/family/FamilyMemberCard.jsx
import { generateMemberCarePlan } from '../../utils/carePlanEngine';
import MemberCardHeader from './MemberCardHeader';
import MemberCardDetails from './MemberCardDetails';
import MemberCardActionBar from './MemberCardActionBar';
import FamilyMemberCarePlan from './FamilyMemberCarePlan';

export default function FamilyMemberCard({
  member,
  profile,
  aqiData,
  memberAqiData,
  isPlanOpen,
  onTogglePlan,
  onEdit,
  onDelete,
  onPersonalize
}) {
  const activeAqi = memberAqiData || aqiData || { aqi: 165, category: 'Moderate' };
  const carePlan = generateMemberCarePlan(member, activeAqi);

  return (
    <div className="interactive-card rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 md:p-8 shadow-soft dark:shadow-soft-dark transition-all hover:border-sky-300 dark:hover:border-sky-700">
      <MemberCardHeader
        member={member}
        profile={profile}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <MemberCardDetails member={member} />
      <MemberCardActionBar
        member={member}
        isPlanOpen={isPlanOpen}
        onTogglePlan={onTogglePlan}
        onPersonalize={onPersonalize}
      />
      {isPlanOpen && (
        <FamilyMemberCarePlan
          member={member}
          carePlan={carePlan}
          memberAqiData={activeAqi}
        />
      )}
    </div>
  );
}
