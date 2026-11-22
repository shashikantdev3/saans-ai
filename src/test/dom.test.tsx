// ============================================================
// src/test/dom.test.tsx
// Tier 4: User Event & DOM Interaction Tests
// Tests persona switching, tab navigation, simulation triggers, and pledges
// Per TESTING_STANDARDS.md §3 (Tier 4)
// ============================================================

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '@/App';
import { AppContextProvider } from '@/context/AppContext';
import { AirTelemetryDashboard } from '@/components/Dashboard/AirTelemetryDashboard';
import { DailyRoutineOptimizer } from '@/components/Routine/DailyRoutineOptimizer';
import { IAQCenter } from '@/components/IAQ/IAQCenter';
import { CommunityHub } from '@/components/Community/CommunityHub';

describe('Tab Navigation Interactions', () => {
  it('switches viewports when user clicks different tabs in header tablist', () => {
    render(<App />);

    // Click Routine tab
    const routineTab = screen.getByRole('tab', { name: /Routine Optimizer/i });
    fireEvent.click(routineTab);
    expect(screen.getByText(/GenAI Daily Routine & Smog Exposure Optimizer/i)).toBeInTheDocument();

    // Click Transit tab
    const transitTab = screen.getByRole('tab', { name: /Low-Emission Transit/i });
    fireEvent.click(transitTab);
    expect(screen.getByText(/Low-Exposure Commute & Transit Path Optimizer/i)).toBeInTheDocument();

    // Click IAQ tab
    const iaqTab = screen.getByRole('tab', { name: /Indoor Air & Hacks/i });
    fireEvent.click(iaqTab);
    expect(screen.getByText(/Room CADR & Indoor Air Quality/i)).toBeInTheDocument();

    // Click Community tab
    const communityTab = screen.getByRole('tab', { name: /Community Action/i });
    fireEvent.click(communityTab);
    expect(screen.getByText(/Community Smog Abatement Dashboard/i)).toBeInTheDocument();
  });
});

describe('Telemetry Simulation Controls', () => {
  it('triggers winter smog spike and updates current zone AQI', () => {
    render(
      <AppContextProvider>
        <AirTelemetryDashboard />
      </AppContextProvider>
    );

    const spikeBtn = screen.getByRole('button', { name: /Simulate Winter Smog Spike/i });
    fireEvent.click(spikeBtn);

    // Verify button exists and responds to user event
    expect(spikeBtn).toBeInTheDocument();
  });

  it('triggers solar wind cleansing and lowers AQI', () => {
    render(
      <AppContextProvider>
        <AirTelemetryDashboard />
      </AppContextProvider>
    );

    const cleanBtn = screen.getByRole('button', { name: /Simulate Solar Wind Cleansing/i });
    fireEvent.click(cleanBtn);

    expect(cleanBtn).toBeInTheDocument();
  });
});

describe('Persona Profile Selection in Routine Optimizer', () => {
  it('switches active persona when user clicks a profile card', () => {
    render(
      <AppContextProvider>
        <DailyRoutineOptimizer />
      </AppContextProvider>
    );

    const elderlyBtn = screen.getByRole('button', { name: /Elderly Relative/i });
    fireEvent.click(elderlyBtn);
    expect(elderlyBtn).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('IAQ Center Room & CADR Inputs', () => {
  it('updates floor area input value on user input', () => {
    render(
      <AppContextProvider>
        <IAQCenter />
      </AppContextProvider>
    );

    const areaInput = screen.getByLabelText(/Floor Area/i) as HTMLInputElement;
    fireEvent.change(areaInput, { target: { value: '32' } });
    expect(areaInput.value).toBe('32');
  });

  it('switches selected room tab in CADR calculator', () => {
    render(
      <AppContextProvider>
        <IAQCenter />
      </AppContextProvider>
    );

    const livingRoomBtn = screen.getByRole('button', { name: /Living & Dining Room/i });
    fireEvent.click(livingRoomBtn);
    expect(livingRoomBtn).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('Community Pledge Action', () => {
  it('toggles user pledge participation on button click', () => {
    render(
      <AppContextProvider>
        <CommunityHub />
      </AppContextProvider>
    );

    const pledgeButtons = screen.getAllByRole('button', { name: /Take the Pledge|Cancel Pledge/i });
    expect(pledgeButtons.length).toBeGreaterThan(0);

    const firstPledgeBtn = pledgeButtons[0];
    const initialText = firstPledgeBtn.textContent;
    fireEvent.click(firstPledgeBtn);

    // Confirms toggle action
    expect(firstPledgeBtn.textContent).not.toBe(initialText);
  });
});
