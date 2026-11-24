// tests/about-components.test.jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import AboutAqiSection from '../src/components/about/AboutAqiSection';
import AboutScienceSection from '../src/components/about/AboutScienceSection';
import AboutPortalsSection from '../src/components/about/AboutPortalsSection';
import AboutEmergencySection from '../src/components/about/AboutEmergencySection';
import AboutDisclaimerSection from '../src/components/about/AboutDisclaimerSection';
import AboutDeveloperCard from '../src/components/about/AboutDeveloperCard';
import InversionDiagram from '../src/components/about/InversionDiagram';
import SmogComparisonDiagram from '../src/components/about/SmogComparisonDiagram';
import ArchitectureDiagram from '../src/components/about/ArchitectureDiagram';
import AqiPollutantsGrid from '../src/components/about/AqiPollutantsGrid';

describe('About Page Modular Components & Accessibility', () => {
  describe('AboutAqiSection', () => {
    it('renders Section 1 header, formula, table, and pollutants grid', () => {
      render(<AboutAqiSection />);
      expect(
        screen.getByText(/Section 1: What is National AQI \(CPCB NAQI\)\?/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/CPCB Linear Interpolation Sub-Index Formula/i)
      ).toBeInTheDocument();
      expect(screen.getByText('Satisfactory')).toBeInTheDocument();
      expect(screen.getByText('PM2.5')).toBeInTheDocument();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<AboutAqiSection />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('AboutScienceSection', () => {
    it('renders Section 2 with Indian causes and both diagrams', () => {
      render(<AboutScienceSection />);
      expect(
        screen.getByText(/Section 2: Fog, Smog & Atmospheric Inversions/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/Stubble Burning \(Parali\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Vehicular & Road Dust/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Normal Atmospheric Dispersion vs Winter Thermal Inversion Lid/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Classical London-Type Winter Smog vs Photochemical Summer Smog/i)
      ).toBeInTheDocument();
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<AboutScienceSection />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('AboutPortalsSection', () => {
    it('renders official portal cards with valid external links', () => {
      render(<AboutPortalsSection />);
      expect(
        screen.getByText(/Section 3: Government of India Official Portals & Alerts/i)
      ).toBeInTheDocument();
      expect(screen.getByText('National Air Quality Index (NAQI) Bulletins')).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: /Central Pollution Control Board \(CPCB\) official portal/i })
      ).toBeInTheDocument();
      expect(screen.getAllByText('Check the official page for live alerts').length).toBe(4);
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<AboutPortalsSection />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('AboutEmergencySection', () => {
    it('renders emergency numbers with direct tel: links', () => {
      render(<AboutEmergencySection />);
      expect(
        screen.getByText(/Section 4: Verified Emergency Helplines \(Pan-India\)/i)
      ).toBeInTheDocument();
      expect(screen.getByText('112')).toBeInTheDocument();
      expect(screen.getByText('108')).toBeInTheDocument();

      const dial112 = screen.getByRole('link', { name: /Tap to Dial 112/i });
      expect(dial112).toHaveAttribute('href', 'tel:112');
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<AboutEmergencySection />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('AboutDisclaimerSection & AboutDeveloperCard', () => {
    it('renders Section 5, architecture diagram, author card, and disclaimer', () => {
      render(<AboutDisclaimerSection />);
      expect(
        screen.getByText(/Section 5: System Architecture & Credits/i)
      ).toBeInTheDocument();
      expect(screen.getByText('1. CLIENT LAYER')).toBeInTheDocument();
      expect(screen.getByText('2. SERVERLESS BACKEND')).toBeInTheDocument();
      expect(screen.getByText('3. CLOUD & AI APIS')).toBeInTheDocument();
      expect(screen.getByText(/Medical Disclaimer:/i)).toBeInTheDocument();
    });

    it('AboutDeveloperCard contains accessible links for GitHub and LinkedIn', () => {
      render(<AboutDeveloperCard />);
      const githubLink = screen.getByRole('link', {
        name: 'Rishav Nandi on GitHub (opens in a new tab)'
      });
      const linkedinLink = screen.getByRole('link', {
        name: 'Rishav Nandi on LinkedIn (opens in a new tab)'
      });

      expect(githubLink).toHaveAttribute('href', 'https://github.com/Rishav-coder-ops');
      expect(githubLink).toHaveAttribute('target', '_blank');
      expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer');

      expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/in/rishav-nandi-2k7/');
      expect(linkedinLink).toHaveAttribute('target', '_blank');
      expect(linkedinLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('has no accessibility violations', async () => {
      const { container } = render(<AboutDisclaimerSection />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Diagram Components Direct Render', () => {
    it('InversionDiagram renders SVG cleanly', () => {
      const { container } = render(<InversionDiagram />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('SmogComparisonDiagram renders SVG cleanly', () => {
      const { container } = render(<SmogComparisonDiagram />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('ArchitectureDiagram renders SVG cleanly', () => {
      const { container } = render(<ArchitectureDiagram />);
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('AqiPollutantsGrid renders 6 CPCB pollutants', () => {
      render(<AqiPollutantsGrid />);
      expect(screen.getByText('PM2.5')).toBeInTheDocument();
      expect(screen.getByText('PM10')).toBeInTheDocument();
      expect(screen.getByText('NO2')).toBeInTheDocument();
      expect(screen.getByText('SO2')).toBeInTheDocument();
      expect(screen.getByText('CO')).toBeInTheDocument();
      expect(screen.getByText('O3')).toBeInTheDocument();
    });
  });
});
