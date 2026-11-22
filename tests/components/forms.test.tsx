// @vitest-environment jsdom
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LocationPicker } from '@/components/location/LocationPicker';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { DEFAULT_PROFILE, SAMPLE_PROFILE } from '@/lib/profile/schema';
import { renderIn } from './render';

afterEach(() => vi.unstubAllGlobals());

describe('LocationPicker', () => {
  const search = (text: string) => {
    fireEvent.change(screen.getByLabelText('Search a city'), { target: { value: text } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
  };

  it('validates input before calling the API', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    renderIn(<LocationPicker onPick={vi.fn()} />);
    search('a');
    expect(await screen.findByRole('alert')).toHaveProperty(
      'textContent',
      'Type at least 2 letters.',
    );
    search('<script>');
    expect(screen.getByRole('alert').textContent).toContain('Use letters only');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('lists results and passes the chosen place up', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        Response.json({
          places: [
            { id: 1, name: 'Delhi', lat: 28.65, lon: 77.23, admin1: 'Delhi', country: 'India' },
          ],
        }),
      ),
    );
    const onPick = vi.fn();
    renderIn(<LocationPicker onPick={onPick} />);
    search('Delhi');
    fireEvent.click(await screen.findByRole('button', { name: 'Delhi, Delhi, India' }));
    expect(onPick).toHaveBeenCalledWith({ name: 'Delhi', lat: 28.65, lon: 77.23 });
  });

  it('says so when nothing matches', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ places: [] })),
    );
    renderIn(<LocationPicker onPick={vi.fn()} />);
    search('xyzqq');
    expect(await screen.findByText(/No place found for "xyzqq"/)).toBeTruthy();
  });

  it('quick picks need no typing', () => {
    const onPick = vi.fn();
    renderIn(<LocationPicker onPick={onPick} />);
    fireEvent.click(screen.getByRole('button', { name: 'Bengaluru' }));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ name: 'Bengaluru' }));
  });

  it('explains a denied location permission', () => {
    vi.stubGlobal('navigator', {
      geolocation: {
        getCurrentPosition: (
          _ok: unknown,
          fail: (e: { code: number; PERMISSION_DENIED: number }) => void,
        ) => fail({ code: 1, PERMISSION_DENIED: 1 }),
      },
    });
    renderIn(<LocationPicker onPick={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Use my location' }));
    expect(screen.getByRole('alert').textContent).toContain('permission was denied');
  });
});

describe('ProfileForm', () => {
  it('rejects out-of-range numbers and marks the field', () => {
    const onSubmit = vi.fn();
    renderIn(<ProfileForm initial={DEFAULT_PROFILE} onSubmit={onSubmit} onClear={vi.fn()} />);
    const people = screen.getByLabelText('People at home');
    fireEvent.change(people, { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Make my plan' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(people.getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByRole('alert').textContent).toContain('People at home');
  });

  it('submits a parsed profile', () => {
    const onSubmit = vi.fn();
    renderIn(<ProfileForm initial={DEFAULT_PROFILE} onSubmit={onSubmit} onClear={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('People at home'), { target: { value: '5' } });
    fireEvent.click(screen.getByLabelText('A child'));
    fireEvent.change(screen.getByLabelText('Main commute'), { target: { value: 'car' } });
    fireEvent.click(screen.getByRole('button', { name: 'Make my plan' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ people: 5, hasChild: true, commuteMode: 'car' }),
    );
  });

  it('loads the sample family and clears on request', () => {
    const onSubmit = vi.fn();
    const onClear = vi.fn();
    renderIn(<ProfileForm initial={DEFAULT_PROFILE} onSubmit={onSubmit} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: 'Try a sample family' }));
    expect(onSubmit).toHaveBeenCalledWith(SAMPLE_PROFILE);
    fireEvent.click(screen.getByRole('button', { name: 'Clear saved details' }));
    expect(onClear).toHaveBeenCalled();
  });

  it('renders in Hindi', async () => {
    renderIn(<ProfileForm initial={DEFAULT_PROFILE} onSubmit={vi.fn()} onClear={vi.fn()} />, 'hi');
    await waitFor(() => expect(screen.getByRole('button', { name: 'मेरा प्लान बनाएँ' })).toBeTruthy());
  });
});
