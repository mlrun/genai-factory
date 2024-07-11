// src/components/LoginForm.test.tsx
import { ChakraProvider } from '@chakra-ui/react'
import useAuth from '@hooks/useAuth'
import theme from '@shared/theme' // Ensure this path matches your theme file location
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import Login from './Login'

const mockedNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate
}))

jest.mock('@hooks/useAuth')

const mockLogin = jest.fn()

const renderWithProviders = (ui: React.ReactElement) => {
  const Wrapper: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    return (
      <Provider>
        <BrowserRouter>
          <ChakraProvider theme={theme}>{children}</ChakraProvider>
        </BrowserRouter>
      </Provider>
    )
  }
  return render(ui, { wrapper: Wrapper })
}

describe('Login Component', () => {
  beforeEach(() => {
    mockedNavigate.mockReset()
    ;(useAuth as jest.Mock).mockReturnValue({
      user: null,
      login: mockLogin,
      logout: jest.fn()
    })
  })

  it('renders Login component', () => {
    renderWithProviders(<Login />)

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/admin mode/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('handles input change', () => {
    renderWithProviders(<Login />)

    const usernameInput = screen.getByLabelText('Username')
    const passwordInput = screen.getByLabelText('Password')

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    expect(usernameInput).toHaveValue('testuser')

    fireEvent.change(passwordInput, { target: { value: 'testpassword' } })
    expect(passwordInput).toHaveValue('testpassword')
  })

  it('handles admin mode switch', () => {
    renderWithProviders(<Login />)

    const adminSwitch = screen.getByLabelText(/admin mode/i)
    expect(adminSwitch).not.toBeChecked()

    fireEvent.click(adminSwitch)
    expect(adminSwitch).toBeChecked()
  })

  it('navigates on submit', async () => {
    renderWithProviders(<Login />)

    const loginButton = screen.getByRole('button', { name: /login/i })
    fireEvent.click(loginButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })

    setTimeout(async () => {
      await waitFor(() => {
        expect(mockedNavigate).toHaveBeenCalledWith('/chat')
      })
    }, 1000)
  })
})
