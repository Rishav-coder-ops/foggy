// tests/family-profiles.test.jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe } from 'vitest-axe';
import FamilyProfilesHeader from '../src/components/family/FamilyProfilesHeader';
import NoMembersEmptyState from '../src/components/family/NoMembersEmptyState';
import MemberCardHeader from '../src/components/family/MemberCardHeader';
import MemberCardDetails from '../src/components/family/MemberCardDetails';
import MemberCardActionBar from '../src/components/family/MemberCardActionBar';
import FamilyMemberCard from '../src/components/family/FamilyMemberCard';
import FamilyMemberList from '../src/components/family/FamilyMemberList';
import FamilyMemberCarePlan from '../src/components/family/FamilyMemberCarePlan';
import FamilyAiPersonalizationModal from '../src/components/family/FamilyAiPersonalizationModal';
import FamilyMemberFormModal from '../src/components/family/FamilyMemberFormModal';
import FamilyProfilesPage from '../src/pages/FamilyProfilesPage';
import {
  getRoleIcon,
  buildDefaultFormData,
  buildEditFormData
} from '../src/constants/family/familyConstants';

const mockMember = {
  id: 'm-1',
  name: 'Aarav',
  relationship: 'Son',
  age: 10,
  city: 'Kolkata',
  state: 'West Bengal',
  conditions: ['Asthma'],
  sensitivity: 'High',
  commute: ['School Bus'],
  lifestyle: ['Football'],
  notes: 'Keep inhaler in school bag'
};

const mockProfile = {
  city: 'Kolkata',
  state: 'West Bengal',
  country: 'India',
  latitude: 22.57,
  longitude: 88.36
};

const mockProfileContext = {
  profile: mockProfile,
  familyMembers: [mockMember],
  addFamilyMember: vi.fn(),
  updateFamilyMember: vi.fn(),
  deleteFamilyMember: vi.fn()
};

vi.mock('../src/context/ProfileContext', () => ({
  useProfile: () => mockProfileContext
}));

vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'u-123', getIdToken: vi.fn().mockResolvedValue('token') } })
}));

describe('Family Profiles Components & Accessibility', () => {
  describe('familyConstants helpers', () => {
    it('returns appropriate role icons', () => {
      expect(getRoleIcon('Son')).toBe('🧒');
      expect(getRoleIcon('Pet')).toBe('🐾');
      expect(getRoleIcon('Dadi')).toBe('👵');
      expect(getRoleIcon('Mother')).toBe('🧑');
      expect(getRoleIcon('Spouse')).toBe('❤️');
      expect(getRoleIcon('Friend')).toBe('👤');
    });

    it('builds default and edit form data structures', () => {
      const def = buildDefaultFormData(mockProfile);
      expect(def.name).toBe('');
      expect(def.relationship).toBe('Son');
      expect(def.state).toBe('West Bengal');

      const edit = buildEditFormData(mockMember, mockProfile);
      expect(edit.name).toBe('Aarav');
      expect(edit.age).toBe('10');
      expect(edit.conditions).toEqual(['Asthma']);
    });
  });

  describe('FamilyProfilesHeader', () => {
    it('renders title and triggers onAddMember when clicked', () => {
      const onAdd = vi.fn();
      render(<FamilyProfilesHeader onAddMember={onAdd} />);
      expect(screen.getByText('Household Care Network')).toBeInTheDocument();
      const btn = screen.getByRole('button', { name: /Add Family Member/i });
      fireEvent.click(btn);
      expect(onAdd).toHaveBeenCalledOnce();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<FamilyProfilesHeader onAddMember={() => {}} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('NoMembersEmptyState', () => {
    it('renders empty message and triggers onAddMember', () => {
      const onAdd = vi.fn();
      render(<NoMembersEmptyState onAddMember={onAdd} />);
      expect(screen.getByText('No family profiles added yet')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Add First Profile/i }));
      expect(onAdd).toHaveBeenCalledOnce();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<NoMembersEmptyState onAddMember={() => {}} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('MemberCardHeader, Details, ActionBar & FamilyMemberCard', () => {
    it('MemberCardHeader renders name, age, badges, and triggers edit/delete', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      render(
        <MemberCardHeader
          member={mockMember}
          profile={mockProfile}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      );
      expect(screen.getByText('Aarav')).toBeInTheDocument();
      expect(screen.getByText('• 10 yrs old')).toBeInTheDocument();
      expect(screen.getByText('High Sensitivity')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /Edit Aarav/i }));
      expect(onEdit).toHaveBeenCalledWith(mockMember);

      fireEvent.click(screen.getByRole('button', { name: /Delete Aarav/i }));
      expect(onDelete).toHaveBeenCalledWith('m-1', 'Aarav');
    });

    it('MemberCardDetails renders conditions, commute, lifestyle, and notes', () => {
      render(<MemberCardDetails member={mockMember} />);
      expect(screen.getByText('Asthma')).toBeInTheDocument();
      expect(screen.getByText('School Bus')).toBeInTheDocument();
      expect(screen.getByText('Football')).toBeInTheDocument();
      expect(screen.getByText(/Keep inhaler in school bag/i)).toBeInTheDocument();
    });

    it('MemberCardActionBar toggles plan and personalizes with Foggy', () => {
      const onToggle = vi.fn();
      const onPersonalize = vi.fn();
      render(
        <MemberCardActionBar
          member={mockMember}
          isPlanOpen={false}
          onTogglePlan={onToggle}
          onPersonalize={onPersonalize}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /View Today's Care Plan/i }));
      expect(onToggle).toHaveBeenCalledWith('m-1');

      fireEvent.click(screen.getByRole('button', { name: /Personalise with Foggy/i }));
      expect(onPersonalize).toHaveBeenCalledWith(mockMember);
    });

    it('FamilyMemberCard renders full member card with accessibility check', async () => {
      const { container } = render(
        <FamilyMemberCard
          member={mockMember}
          profile={mockProfile}
          aqiData={{ aqi: 180, category: 'Moderate' }}
          memberAqiData={{ aqi: 180, category: 'Moderate' }}
          isPlanOpen={true}
          onTogglePlan={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          onPersonalize={() => {}}
        />
      );
      expect(screen.getByText(/Today's Care Plan for Aarav/i)).toBeInTheDocument();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('FamilyMemberCarePlan directly renders diurnal slots and do/avoid lists', () => {
      const carePlan = {
        aqi: 220,
        category: 'Poor',
        timeSlots: [
          {
            slot: '6:00 AM – 9:00 AM',
            forecastBadge: 'Hazardous',
            guidance: 'Avoid outdoors',
            lifestyleAdjustment: 'Stay indoors'
          }
        ],
        doList: ['Wear N95'],
        avoidList: ['Morning jogging'],
        maskAdvice: 'Use certified N95',
        commuteTips: ['Keep car windows rolled up'],
        conditionReminders: ['Carry rescue inhaler'],
        hydrationAdvice: 'Drink 2.5L water'
      };
      render(
        <FamilyMemberCarePlan
          member={mockMember}
          carePlan={carePlan}
          memberAqiData={{ aqi: 220 }}
        />
      );
      expect(screen.getByText(/Today's Care Plan for Aarav/i)).toBeInTheDocument();
      expect(screen.getByText('Morning jogging')).toBeInTheDocument();
    });

    it('FamilyMemberList renders multiple members', () => {
      const members = [
        mockMember,
        { ...mockMember, id: 'm-2', name: 'Ananya', relationship: 'Daughter' }
      ];
      render(
        <FamilyMemberList
          familyMembers={members}
          profile={mockProfile}
          aqiData={{ aqi: 150 }}
          membersAqi={{}}
          expandedPlans={{}}
          onTogglePlan={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          onPersonalize={() => {}}
        />
      );
      expect(screen.getByText('Aarav')).toBeInTheDocument();
      expect(screen.getByText('Ananya')).toBeInTheDocument();
    });
  });

  describe('FamilyAiPersonalizationModal', () => {
    it('renders modal in success state with memo and care plan preview', () => {
      const onClose = vi.fn();
      render(
        <FamilyAiPersonalizationModal
          member={mockMember}
          aiMemo="Personalized guidance for Aarav: Wear an N95 mask and carry inhaler."
          loadingAi={false}
          aiError=""
          aqiData={{ aqi: 165, category: 'Moderate' }}
          onClose={onClose}
          onRetry={() => {}}
        />
      );
      expect(screen.getByText(/Foggy's Air Memo for Aarav/i)).toBeInTheDocument();
      expect(screen.getByText(/Wear an N95 mask and carry inhaler/i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Close Memo/i }));
      expect(onClose).toHaveBeenCalledOnce();
    });

    it('renders retry button in error state', () => {
      const onRetry = vi.fn();
      render(
        <FamilyAiPersonalizationModal
          member={mockMember}
          aiMemo=""
          loadingAi={false}
          aiError="Foggy is busy, try again in a minute."
          aqiData={{ aqi: 165 }}
          onClose={() => {}}
          onRetry={onRetry}
        />
      );
      expect(screen.getByText(/Foggy is busy, try again in a minute./i)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
      expect(onRetry).toHaveBeenCalledOnce();
    });
  });

  describe('FamilyMemberFormModal', () => {
    it('renders form inputs and handles cancel/submit', () => {
      const onClose = vi.fn();
      const onSubmit = vi.fn((e) => e.preventDefault());
      render(
        <FamilyMemberFormModal
          isOpen={true}
          editingId={null}
          formData={buildDefaultFormData(mockProfile)}
          formErrors={{}}
          citySuggestions={[]}
          searchingCity={false}
          onClose={onClose}
          onChange={() => {}}
          onCityInput={() => {}}
          onSelectCitySuggestion={() => {}}
          onSubmit={onSubmit}
        />
      );
      expect(screen.getByText('Add New Family Member Profile')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
      expect(onClose).toHaveBeenCalledOnce();

      fireEvent.click(screen.getByRole('button', { name: /Save Member/i }));
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    it('does not render when isOpen is false', () => {
      const { container } = render(
        <FamilyMemberFormModal
          isOpen={false}
          editingId={null}
          formData={buildDefaultFormData(mockProfile)}
          formErrors={{}}
          citySuggestions={[]}
          searchingCity={false}
          onClose={() => {}}
          onChange={() => {}}
          onCityInput={() => {}}
          onSelectCitySuggestion={() => {}}
          onSubmit={() => {}}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('FamilyProfilesPage Integration & Accessibility Audit', () => {
    it('renders FamilyProfilesPage with members and passes axe accessibility audit', async () => {
      const { container } = render(<FamilyProfilesPage />);
      expect(screen.getByText('Household Care Network')).toBeInTheDocument();
      expect(screen.getByText('Aarav')).toBeInTheDocument();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('renders NoMembersEmptyState when familyMembers is empty', () => {
      mockProfileContext.familyMembers = [];
      render(<FamilyProfilesPage />);
      expect(screen.getByText('No family profiles added yet')).toBeInTheDocument();
      mockProfileContext.familyMembers = [mockMember];
    });
  });
});
