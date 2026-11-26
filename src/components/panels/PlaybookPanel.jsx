// src/components/panels/PlaybookPanel.jsx
// Clean Air Playbook: Free to Premium Feature Box & Expanded Modal
import { useState, useRef } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';
import ExpandablePanelModal from '../ExpandablePanelModal';
import PanelCitySearch from '../PanelCitySearch';
import { useChat } from '../../context/ChatContext';
import { PLAYBOOK_DATA } from '../../constants/playbookData';
import { getAQIAdviceBanner } from '../../utils/aqiDisplayHelpers';
import PlaybookFeatureCard from './PlaybookFeatureCard';
import PlaybookTierTabs from './PlaybookTierTabs';
import PlaybookCardGrid from './PlaybookCardGrid';

/**
 * Clean Air Playbook: Tiered Smog Defense panel with modal deep-dive
 * covering Free (₹0), Budget (< ₹1,000), and Premium (₹1,000+) strategies.
 */
export default function PlaybookPanel({
  currentAqi = 165,
  location,
  onCitySelect,
  onUseMyLocation,
  geoLoading = false,
  geoError = null
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('free');
  const cardRef = useRef(null);
  const { openChat, setInputMessage } = useChat();

  const handleAskFoggy = (item) => {
    const promptText = `Can you guide me through implementing the "${item.action}" from the Clean Air Playbook? Approximate cost is ${item.cost}, effort is ${item.effort}. How does it help my family in ${location?.name || 'Kolkata'} during today's Estimated NAQI of ${currentAqi}?`;
    if (setInputMessage) setInputMessage(promptText);
    if (openChat) openChat();
    setIsOpen(false);
  };

  const aqiBanner = getAQIAdviceBanner(currentAqi);
  const currentItems = PLAYBOOK_DATA[activeTab] || PLAYBOOK_DATA.free;

  return (
    <>
      <PlaybookFeatureCard cardRef={cardRef} isOpen={isOpen} onOpen={() => setIsOpen(true)} />

      <ExpandablePanelModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Clean Air Playbook: Tiered Smog Defense"
        subtitle={`Actionable particulate reduction interventions for ${location?.name || 'Kolkata'} (Estimated NAQI: ${currentAqi})`}
        icon={ShieldCheck}
        triggerRef={cardRef}
        badge={
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            Field-Tested Strategies (₹)
          </span>
        }
      >
        <PanelCitySearch
          currentLocation={location}
          onCitySelect={onCitySelect}
          onUseMyLocation={onUseMyLocation}
          geoLoading={geoLoading}
          geoError={geoError}
        />

        {/* Match to Today's AQI Banner */}
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 shadow-xs ${aqiBanner.badgeClass}`}
        >
          <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-xs font-bold uppercase tracking-wider block">
              Match to Today’s NAQI: {currentAqi} ({aqiBanner.level})
            </span>
            <p className="text-xs leading-relaxed font-medium">{aqiBanner.message}</p>
          </div>
        </div>

        <PlaybookTierTabs activeTab={activeTab} onSelectTab={setActiveTab} />

        <PlaybookCardGrid items={currentItems} onAskFoggy={handleAskFoggy} />

        {/* Disclaimer Note */}
        <div className="p-3.5 rounded-2xl bg-[#E2E8F0] dark:bg-[#1E293B] border border-[#CBD5E1] dark:border-[#334155] text-[11px] text-[#334155] dark:text-[#CBD5E1] space-y-1">
          <p>
            *<strong className="text-slate-900 dark:text-white">Note on Pricing & Impacts:</strong>{' '}
            All costs and PM2.5 mitigation percentages are approximate estimates based on
            peer-reviewed environmental engineering research (CPCB, WHO, and Corsi-Rosenthal data)
            and are not guaranteed results. Prices in INR (₹) are estimated for Indian retail
            markets and may vary by city and brand.
          </p>
        </div>

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
