import { ChakraProvider } from '@chakra-ui/react'
import theme from '@shared/theme' // Ensure this path matches your theme file location
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'jotai'
import React from 'react'
import { BrowserRouter, useNavigate } from 'react-router-dom'
import Login from './Login'

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}))

const mockNavigate = useNavigate as jest.Mock

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
    mockNavigate.mockReset()
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

    fireEvent.change(usernameInput, { target: { value: 'testpassword' } })
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
    setTimeout(async () => {
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/chat')
      })
    }, 1000)
  })
})
