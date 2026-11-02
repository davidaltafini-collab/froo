import { describe, it, expect } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { AppProvider } from './context/AppContext';

function renderApp() {
  return render(
    <AppProvider>
      <App />
    </AppProvider>
  );
}

describe('App', () => {
  it('renders the shell and the Dashboard view by default', async () => {
    renderApp();

    expect(screen.getByRole('heading', { level: 1, name: 'Necula David' })).toBeInTheDocument();
    expect(await screen.findByText('Weekly Offers')).toBeInTheDocument();
  });

  it('switches views via the bottom navigation', async () => {
    const user = userEvent.setup();
    renderApp();

    const nav = screen.getByRole('navigation');

    await user.click(within(nav).getByRole('button', { name: /^list$/i }));
    expect(await screen.findByText('Shopping Lists')).toBeInTheDocument();

    await user.click(within(nav).getByRole('button', { name: /^stores$/i }));
    expect(await screen.findByText('Nearby Stores')).toBeInTheDocument();

    await user.click(within(nav).getByRole('button', { name: /^offers$/i }));
    expect(await screen.findByText('Digital Coupons')).toBeInTheDocument();

    await user.click(within(nav).getByRole('button', { name: /^dashboard$/i }));
    expect(await screen.findByText('Weekly Offers')).toBeInTheDocument();
  });

  it('resets the page scroll position when switching tabs', async () => {
    const user = userEvent.setup();
    renderApp();

    const main = screen.getByRole('main');
    const nav = screen.getByRole('navigation');

    main.scrollTop = 320;
    await user.click(within(nav).getByRole('button', { name: /^offers$/i }));

    await waitFor(() => {
      expect(main.scrollTop).toBe(0);
    });
  });
});
