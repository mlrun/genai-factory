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
import { Provider } from 'jotai';
import { BrowserRouter } from 'react-router-dom';

import { ChakraProvider } from '@chakra-ui/react';
import theme from '@shared/theme'; // Ensure this path matches your theme file location
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Login from './Login';

import useAuth from '@hooks/useAuth';

const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

jest.mock('@hooks/useAuth');

const mockLogin = jest.fn();

const renderWithProviders = (ui: React.ReactElement) => {
  const Wrapper: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    return (
      <Provider>
        <BrowserRouter>
          <ChakraProvider theme={theme}>{children}</ChakraProvider>
        </BrowserRouter>
      </Provider>
    );
  };
  return render(ui, { wrapper: Wrapper });
};

describe('Login Component', () => {
  beforeEach(() => {
    mockedNavigate.mockReset();
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      login: mockLogin,
      logout: jest.fn(),
    });
  });

  it('renders Login component', () => {
    renderWithProviders(<Login />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/admin mode/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('handles input change', () => {
    renderWithProviders(<Login />);

    const usernameInput = screen.getByTestId('username');
    const passwordInput = screen.getByTestId('password');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    expect(usernameInput).toHaveValue('testuser');

    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });
    expect(passwordInput).toHaveValue('testpassword');
  });

  it('handles admin mode switch', () => {
    renderWithProviders(<Login />);

    const adminSwitch = screen.getByLabelText(/admin mode/i);
    expect(adminSwitch).not.toBeChecked();

    fireEvent.click(adminSwitch);
    expect(adminSwitch).toBeChecked();
  });

  it('disables login button when username or password is empty', () => {
    renderWithProviders(<Login />);

    const loginButton = screen.getByRole('button', { name: /login/i });
    expect(loginButton).toBeDisabled();

    const usernameInput = screen.getByTestId('username');
    fireEvent.change(usernameInput, { target: { value: '' } });
    expect(loginButton).toBeDisabled();

    const passwordInput = screen.getByTestId('password');
    fireEvent.change(passwordInput, { target: { value: 'password' } });
    fireEvent.change(usernameInput, { target: { value: 'username' } });

    expect(loginButton).toBeEnabled();
  });

  it('navigates on submit', async () => {
    renderWithProviders(<Login />);

    const usernameInput = screen.getByTestId('username');
    fireEvent.change(usernameInput, { target: { value: 'testuser' } });

    const passwordInput = screen.getByTestId('password');
    fireEvent.change(passwordInput, { target: { value: 'testpassword' } });

    const loginButton = screen.getByRole('button', { name: /login/i });
    fireEvent.click(loginButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
    });

    setTimeout(async () => {
      await waitFor(() => {
        expect(mockedNavigate).toHaveBeenCalledWith('/chat');
      });
    }, 1000);
  });
});
