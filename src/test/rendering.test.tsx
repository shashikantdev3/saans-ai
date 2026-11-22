// ============================================================
// src/test/rendering.test.tsx
// Tier 3: Component Layout & Accessibility Rendering Tests
// Verifies semantic landmarks and WCAG 2.2 AA twin representations
// Per TESTING_STANDARDS.md §3 (Tier 3)
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '@/App';
import { AppContextProvider } from '@/context/AppContext';
import { AirTelemetryDashboard } from '@/components/Dashboard/AirTelemetryDashboard';
import { DailyRoutineOptimizer } from '@/components/Routine/DailyRoutineOptimizer';
import { TransitPlanner } from '@/components/Transit/TransitPlanner';
import { IAQCenter } from '@/components/IAQ/IAQCenter';
import { CommunityHub } from '@/components/Community/CommunityHub';
import { Sparkline } from '@/components/shared/Sparkline';

describe('App Root Layout Rendering', () => {
  it('renders App shell with header, main landmark, and footer', () => {
    render(<App />);
    expect(screen.getByRole('banner', { name: /application header/i })).toBeInTheDocument();
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo', { name: /application footer/i })).toBeInTheDocument();
    expect(screen.getAllByText('Saans (साँस)').length).toBeGreaterThan(0);
    expect(screen.getByText('LIVE')).toBeInTheDocument();
  });
});

describe('AirTelemetryDashboard Rendering', () => {
  it('renders section landmark, KPI header, and simulated controls', () => {
    render(
      <AppContextProvider>
        <AirTelemetryDashboard />
      </AppContextProvider>
    );

    expect(screen.getByLabelText(/Hyperlocal AQI Telemetry Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Urban Smog Heatmap/i)).toBeInTheDocument();
    expect(screen.getByText(/Pollutant Trend Sparklines/i)).toBeInTheDocument();
  });

  it('renders screen reader twin (.sr-only) for SVG heatmap (WCAG Twin Representation)', () => {
    render(
      <AppContextProvider>
        <AirTelemetryDashboard />
      </AppContextProvider>
    );

    const srList = screen.getByLabelText(/Urban air quality heatmap description/i);
    expect(srList).toBeInTheDocument();
    expect(srList).toHaveClass('sr-only');
    expect(srList.children.length).toBeGreaterThan(0);
  });
});

describe('Sparkline Component Rendering', () => {
  it('renders inline SVG alongside sr-only twin readout', () => {
    render(<Sparkline values={[10, 25, 40, 85]} color="#10b981" label="PM2.5 test" />);
    const srTwin = screen.getByText(/PM2.5 test: values ranging from/i);
    expect(srTwin).toBeInTheDocument();
    expect(srTwin).toHaveClass('sr-only');
  });
});

describe('DailyRoutineOptimizer Rendering', () => {
  it('renders persona profile selector chips and generate AI button', () => {
    render(
      <AppContextProvider>
        <DailyRoutineOptimizer />
      </AppContextProvider>
    );

    expect(screen.getByText(/GenAI Daily Routine & Smog Exposure Optimizer/i)).toBeInTheDocument();
    expect(screen.getByText('Asthmatic Child & Family')).toBeInTheDocument();
    expect(screen.getByText('Newborn Infant & Nursing Mother')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate Smart Schedule/i })).toBeInTheDocument();
  });
});

describe('TransitPlanner Rendering', () => {
  it('renders route waypoints selectors, breadcrumb path, and comparison table', () => {
    render(
      <AppContextProvider>
        <TransitPlanner />
      </AppContextProvider>
    );

    expect(screen.getByText(/Low-Exposure Commute & Transit Path Optimizer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Commute Origin Waypoint/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destination Waypoint/i)).toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Underground Metro')).toBeInTheDocument();
  });
});

describe('IAQCenter Rendering', () => {
  it('renders CADR calculator, room parameter inputs, and DIY hack cards', () => {
    render(
      <AppContextProvider>
        <IAQCenter />
      </AppContextProvider>
    );

    expect(screen.getByText(/Room CADR & Indoor Air Quality/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Floor Area/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Purifier Clean Air Delivery Rate/i)).toBeInTheDocument();
    expect(screen.getByText(/Corsi-Rosenthal Box/i)).toBeInTheDocument();
  });
});

describe('CommunityHub Rendering', () => {
  it('renders collective impact counters, emergency advisories, and neighborhood pledges', () => {
    render(
      <AppContextProvider>
        <CommunityHub />
      </AppContextProvider>
    );

    expect(screen.getByText(/Community Smog Abatement Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText('CO₂ Prevented')).toBeInTheDocument();
    expect(screen.getByText('PM2.5 Averted')).toBeInTheDocument();
    expect(screen.getByText(/Neighborhood Carpool & Micro-Transit Days/i)).toBeInTheDocument();
  });
});
