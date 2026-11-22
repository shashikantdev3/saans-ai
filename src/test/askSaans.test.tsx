// ============================================================
// src/test/askSaans.test.tsx
// Ask Saans form: validation, edge cases, and answer rendering
// ============================================================

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppContextProvider } from '@/context/AppContext';
import { AskSaans } from '@/components/Ask/AskSaans';
import { apiService } from '@/services/apiService';
import { aiSourceLabel } from '@/lib/aiSource';

function renderAsk() {
  return render(
    <AppContextProvider>
      <AskSaans />
    </AppContextProvider>,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Ask Saans form', () => {
  it('shows an error and makes no request when the question is empty', () => {
    const spy = vi.spyOn(apiService, 'askSaans');
    renderAsk();

    fireEvent.click(screen.getByRole('button', { name: 'Ask Saans' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Type a question first');
    expect(spy).not.toHaveBeenCalled();
  });

  it('flags questions over 300 characters before sending', () => {
    const spy = vi.spyOn(apiService, 'askSaans');
    renderAsk();

    fireEvent.change(screen.getByLabelText('Your question'), {
      target: { value: 'a'.repeat(301) },
    });
    expect(screen.getByText('301 / 300')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ask Saans' }));
    expect(screen.getByRole('alert')).toHaveTextContent('under 300 characters');
    expect(spy).not.toHaveBeenCalled();
  });

  it('sends the question with the selected zone and shows the Gemini answer and prompt', async () => {
    const spy = vi.spyOn(apiService, 'askSaans').mockResolvedValue({
      answer: 'Keep outdoor play short today and use an N95.',
      source: 'gemini',
      model: 'gemini-3.1-flash-lite',
      promptPreview: 'CONTEXT\nArea: Central Business District',
    });
    renderAsk();

    fireEvent.click(
      screen.getByRole('button', { name: 'Can my child play outside after school today?' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ask Saans' }));

    await waitFor(() =>
      expect(screen.getByText('Keep outdoor play short today and use an N95.')).toBeInTheDocument(),
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ question: 'Can my child play outside after school today?' }),
    );
    expect(screen.getByText(aiSourceLabel('gemini', 'gemini-3.1-flash-lite'))).toBeInTheDocument();
    expect(screen.getByText('What Saans sent to Gemini')).toBeInTheDocument();
  });

  it('shows the server error message when the request fails', async () => {
    vi.spyOn(apiService, 'askSaans').mockRejectedValue(new Error('Too many requests'));
    renderAsk();

    fireEvent.change(screen.getByLabelText('Your question'), {
      target: { value: 'Is the air safe for a walk?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask Saans' }));

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Too many requests'));
  });
});

describe('AI source labels', () => {
  it('describes each answer source in plain words', () => {
    expect(aiSourceLabel('gemini')).toBe('Live Gemini answer');
    expect(aiSourceLabel('rules')).toContain('Gemini unavailable');
    expect(aiSourceLabel('safety')).toContain('no AI');
  });
});
