import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ListView } from './ListView';

describe('ListView', () => {
  it('adds an item to the personal list', async () => {
    const user = userEvent.setup();
    render(<ListView />);

    const input = screen.getByPlaceholderText(/add an item to personal/i);
    await user.type(input, 'Test Item{Enter}');

    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  it('moves items into history when the list is marked done', async () => {
    const user = userEvent.setup();
    render(<ListView />);

    const input = screen.getByPlaceholderText(/add an item to personal/i);
    await user.type(input, 'Test Item{Enter}');
    expect(screen.getByText('Test Item')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /mark list as done/i }));

    await waitFor(() => {
      expect(screen.queryByText('Test Item')).not.toBeInTheDocument();
    });
    expect(screen.getByText(/list is empty/i)).toBeInTheDocument();
  });
});
