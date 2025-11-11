import React from 'react';

import type { SortOption } from '@shared/types';
import { render, screen } from '@testing-library/react';

import Sort from './Sort';

describe('Sort component', () => {
  type TestItem = { id: string; name: string };
  const mockOnSortChange = jest.fn();

  const sortOptions: SortOption<TestItem>[] = [
    { label: 'Name', accessorKey: 'name' },
    { label: 'ID', accessorKey: 'id' },
  ];

  beforeEach(() => {
    mockOnSortChange.mockClear();
  });

  it('renders the selected value in the trigger', () => {
    render(
      <Sort
        sortOptions={sortOptions}
        sortKey="name"
        onSortChange={mockOnSortChange}
      />,
    );

    const trigger = screen.getByRole('combobox');
    // Selected value is visible
    expect(trigger).toHaveTextContent('Name');
  });
});
