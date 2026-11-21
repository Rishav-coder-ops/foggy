// tests/components.test.jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ErrorBoundary from '../src/components/ErrorBoundary.jsx';
import ExpandablePanelModal from '../src/components/ExpandablePanelModal.jsx';
import ThemeToggle from '../src/components/ThemeToggle.jsx';
import ImpactBadge from '../src/components/ImpactBadge.jsx';
import AQICard from '../src/components/AQICard.jsx';
import { ThemeProvider } from '../src/context/ThemeContext.jsx';

// Component that throws error on demand
function CrashingComponent({ shouldThrow }) {
  if (shouldThrow) {
    throw new Error('Test component crashed unexpectedly');
  }
  return <div>Healthy Child Content</div>;
}

describe('tests/components.test.jsx - Core UI Component Verification', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe('ErrorBoundary Component', () => {
    it('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>All systems green</div>
        </ErrorBoundary>
      );
      expect(screen.getByText('All systems green')).toBeInTheDocument();
    });

    it('catches render crash, logs error, and displays friendly fallback UI', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <ErrorBoundary>
          <CrashingComponent shouldThrow={true} />
        </ErrorBoundary>
      );

      // Verify friendly fallback page rendered
      expect(screen.getByText(/Something Went Foggy/i)).toBeInTheDocument();
      expect(screen.getByText(/Test component crashed unexpectedly/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reload Page/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Back to Home/i })).toBeInTheDocument();

      // Verify error logged to console
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('ExpandablePanelModal Component', () => {
    it('renders modal content when isOpen is true', () => {
      render(
        <ExpandablePanelModal
          isOpen={true}
          onClose={vi.fn()}
          title="24-Hour Diurnal Curve"
          subtitle="Hourly particulate projection"
        >
          <p>Modal Body Content</p>
        </ExpandablePanelModal>
      );

      expect(screen.getByText('24-Hour Diurnal Curve')).toBeInTheDocument();
      expect(screen.getByText('Modal Body Content')).toBeInTheDocument();
    });

    it('does not render when isOpen is false', () => {
      render(
        <ExpandablePanelModal isOpen={false} onClose={vi.fn()} title="24-Hour Diurnal Curve">
          <p>Hidden Content</p>
        </ExpandablePanelModal>
      );

      expect(screen.queryByText('24-Hour Diurnal Curve')).not.toBeInTheDocument();
    });

    it('triggers onClose when close button is clicked', () => {
      const onCloseMock = vi.fn();
      render(
        <ExpandablePanelModal isOpen={true} onClose={onCloseMock} title="Test Panel">
          <p>Content</p>
        </ExpandablePanelModal>
      );

      const closeBtn = screen.getByLabelText(/Close panel/i);
      fireEvent.click(closeBtn);
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('triggers onClose when Escape key is pressed', () => {
      const onCloseMock = vi.fn();
      render(
        <ExpandablePanelModal isOpen={true} onClose={onCloseMock} title="Esc Test Panel">
          <p>Press Esc</p>
        </ExpandablePanelModal>
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onCloseMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('ImpactBadge Component', () => {
    it('renders environmental and health impact badges accurately', () => {
      render(
        <ImpactBadge
          co2Saved="1.2 kg CO₂"
          pmReduced="45% PM2.5 reduction"
          healthBenefit="Protects asthmatic airways"
          costTradeoff="Under ₹500"
        />
      );

      expect(screen.getByText('1.2 kg CO₂')).toBeInTheDocument();
      expect(screen.getByText('45% PM2.5 reduction')).toBeInTheDocument();
      expect(screen.getByText(/Protects asthmatic airways/i)).toBeInTheDocument();
      expect(screen.getByText('Under ₹500')).toBeInTheDocument();
    });
  });

  describe('ThemeToggle Component', () => {
    it('toggles theme between light and dark and updates localStorage', () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const toggleButton = screen.getByRole('button');
      expect(toggleButton).toBeInTheDocument();

      // Initial click toggles theme
      fireEvent.click(toggleButton);
      expect(localStorage.setItem).toHaveBeenCalledWith('foggy_theme', expect.any(String));
    });
  });

  describe('AQICard Component', () => {
    it('renders city name, dominant pollutant, and AQI reading', () => {
      const mockData = {
        city: 'Delhi, India',
        aqi: 285,
        category: 'Poor',
        dominantPollutant: 'PM2.5',
        color: '#f97316',
        pollutants: { pm25: 140, pm10: 220 },
        isMock: false,
        updatedAt: '14:30'
      };

      render(
        <MemoryRouter>
          <AQICard aqiData={mockData} onCityChange={vi.fn()} />
        </MemoryRouter>
      );

      expect(screen.getByText(/Delhi, India/i)).toBeInTheDocument();
      expect(screen.getByText('285')).toBeInTheDocument();
      expect(screen.getByText('Poor')).toBeInTheDocument();
      expect(screen.getByText(/Open-Meteo CAMS Model/i)).toBeInTheDocument();
    });
  });
});
