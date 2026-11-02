import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppProvider, useAppContext } from './AppContext';

function Harness() {
  const { currentPoints, setCurrentPoints, redeemedItems, setRedeemedItems } = useAppContext();

  return (
    <div>
      <span data-testid="points">{currentPoints}</span>
      <span data-testid="redeemed-count">{Object.keys(redeemedItems).length}</span>
      <button onClick={() => setCurrentPoints(p => p + 15)}>claim</button>
      <button
        onClick={() =>
          setRedeemedItems(prev => ({
            ...prev,
            'Test Reward': { item: { name: 'Test Reward', cost: 1500, image: '' }, expiry: Date.now() + 60_000 },
          }))
        }
      >
        redeem
      </button>
    </div>
  );
}

describe('AppContext', () => {
  it('starts with the default points balance and no redeemed items', () => {
    render(
      <AppProvider>
        <Harness />
      </AppProvider>
    );

    expect(screen.getByTestId('points')).toHaveTextContent('4820');
    expect(screen.getByTestId('redeemed-count')).toHaveTextContent('0');
  });

  it('updates points when claiming and tracks a redeemed reward', async () => {
    const user = userEvent.setup();
    render(
      <AppProvider>
        <Harness />
      </AppProvider>
    );

    await user.click(screen.getByRole('button', { name: 'claim' }));
    expect(screen.getByTestId('points')).toHaveTextContent('4835');

    await user.click(screen.getByRole('button', { name: 'redeem' }));
    expect(screen.getByTestId('redeemed-count')).toHaveTextContent('1');
  });
});
