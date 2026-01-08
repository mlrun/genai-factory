// Copyright 2024 Iguazio
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { ChangeEvent, useState } from 'react';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import FilterComponent from './Filter';

describe('FilterComponent', () => {
  const mockOnFilter = jest.fn();
  const placeholder = 'Search by name';

  beforeEach(() => {
    mockOnFilter.mockClear();
  });

  it('renders the input with the correct placeholder and value', () => {
    render(
      <FilterComponent
        filterText="test value"
        onFilter={mockOnFilter}
        placeholder={placeholder}
      />,
    );

    const input = screen.getByLabelText('Search Input') as HTMLInputElement;

    expect(input).toBeInTheDocument();
    expect(input.placeholder).toBe(placeholder);
    expect(input.value).toBe('test value');
  });

  it('calls onFilter when user types in the input', async () => {
    const Wrapper = () => {
      const [filterText, setFilterText] = useState('');
      const handleFilter = (e: ChangeEvent<HTMLInputElement>) => {
        setFilterText(e.target.value);
        mockOnFilter(e);
      };

      return (
        <FilterComponent
          filterText={filterText}
          onFilter={handleFilter}
          placeholder={placeholder}
        />
      );
    };

    render(<Wrapper />);

    const input = screen.getByLabelText('Search Input') as HTMLInputElement;
    await userEvent.type(input, 'hello');

    expect(input.value).toBe('hello');

    expect(mockOnFilter).toHaveBeenCalledTimes(5);
    expect(mockOnFilter.mock.calls[0][0].target.value).toBe('hello');
  });

  it('renders the search icon', () => {
    render(
      <FilterComponent
        filterText=""
        onFilter={mockOnFilter}
        placeholder={placeholder}
      />,
    );

    const svgElement =
      screen.getByTestId('mock-svg') ||
      screen.getByRole('img', { hidden: true });
    expect(svgElement).toBeInTheDocument();
  });
});
