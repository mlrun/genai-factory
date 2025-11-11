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

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

import { ChakraProvider } from '@chakra-ui/react';
import theme from '@shared/theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';

import Topbar from './Topbar';

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();

  const Wrapper: React.FC<React.PropsWithChildren<object>> = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      <Router>
        <ChakraProvider theme={theme}>{children}</ChakraProvider>
      </Router>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper });
};

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;

window.matchMedia =
  window.matchMedia ||
  (() => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));

describe('Topbar Component (Zustand)', () => {
  const mockOnLoginChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders Topbar component with logo and avatar', () => {
    renderWithProviders(<Topbar onLoginChange={mockOnLoginChange} />);

    expect(screen.getByTestId('logo')).toBeInTheDocument();
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('opens Rightbar when avatar is clicked', () => {
    renderWithProviders(<Topbar onLoginChange={mockOnLoginChange} />);

    const avatar = screen.getByTestId('avatar');
    fireEvent.click(avatar);

    expect(screen.getByText('Preferences')).toBeInTheDocument();
  });
});
