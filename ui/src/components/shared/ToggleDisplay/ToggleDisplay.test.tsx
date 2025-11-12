import React from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ToggleDisplay from './ToggleDisplay';

import { TOGGLE_OPTIONS } from '@constants';

describe('ToggleDisplay', () => {
  const mockOnDisplayChange = jest.fn();

  beforeEach(() => {
    mockOnDisplayChange.mockClear();
  });

  it('renders all toggle options', () => {
    render(
      <ToggleDisplay display="list" onDisplayChange={mockOnDisplayChange} />,
    );

    TOGGLE_OPTIONS.forEach(({ value }) => {
      const button = screen.getByRole('radio', {
        name: new RegExp(value, 'i'),
      });
      expect(button).toBeInTheDocument();
    });
  });

  it('applies active styles to the selected display option', () => {
    render(
      <ToggleDisplay display="card" onDisplayChange={mockOnDisplayChange} />,
    );

    const activeButton = screen.getByRole('radio', { name: /card/i });
    expect(activeButton).toHaveClass('border-[#0066F3]');
  });

  it('calls onDisplayChange when a different toggle option is clicked', async () => {
    render(
      <ToggleDisplay display="list" onDisplayChange={mockOnDisplayChange} />,
    );

    const cardButton = screen.getByRole('radio', { name: /card/i });
    await userEvent.click(cardButton);

    expect(mockOnDisplayChange).toHaveBeenCalledTimes(1);
    expect(mockOnDisplayChange).toHaveBeenCalledWith('card');
  });
});
