/*
Copyright 2024 Iguazio Systems Ltd.

Licensed under the Apache License, Version 2.0 (the "License") with
an addition restriction as set forth herein. You may not use this
file except in compliance with the License. You may obtain a copy of
the License at http://www.apache.org/licenses/LICENSE-2.0.

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. See the License for the specific language governing
permissions and limitations under the License.

In addition, you may not use the software for any purposes that are
illegal under applicable law, and the grant of the foregoing license
under the Apache 2.0 license is conditioned upon your compliance with
such restriction.
*/

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
