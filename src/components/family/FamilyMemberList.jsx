// src/components/family/FamilyMemberList.jsx
import FamilyMemberCard from './FamilyMemberCard';

export default function FamilyMemberList({
  familyMembers,
  profile,
  aqiData,
  membersAqi,
  expandedPlans,
  onTogglePlan,
  onEdit,
  onDelete,
  onPersonalize
}) {
  return (
    <div className="space-y-6">
      {familyMembers.map((member) => (
        <FamilyMemberCard
          key={member.id}
          member={member}
          profile={profile}
          aqiData={aqiData}
          memberAqiData={membersAqi[member.id]}
          isPlanOpen={!!expandedPlans[member.id]}
          onTogglePlan={onTogglePlan}
          onEdit={onEdit}
          onDelete={onDelete}
          onPersonalize={onPersonalize}
        />
      ))}
    </div>
  );
}
