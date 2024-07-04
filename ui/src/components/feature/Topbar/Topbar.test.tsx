import { ChakraProvider } from '@chakra-ui/react'
import theme from '@shared/theme'
import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'jotai'
import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import Topbar from './Topbar'

const renderWithProviders = (ui: React.ReactElement) => {
  const Wrapper: React.FC<React.PropsWithChildren<object>> = ({ children }) => {
    return (
      <Provider>
        <Router>
          <ChakraProvider theme={theme}>{children}</ChakraProvider>
        </Router>
      </Provider>
    )
  }
  return render(ui, { wrapper: Wrapper })
}

// Mock ResizeObserver
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver

// Mock matchMedia
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: function () {},
      removeListener: function () {}
    }
  }

describe('Topbar component', () => {
  const mockOnLoginChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders Topbar component with logo and avatar', () => {
    renderWithProviders(<Topbar user="testuser" onLoginChange={mockOnLoginChange} />)

    expect(screen.getByTestId('logo')).toBeInTheDocument()
    expect(screen.getByTestId('avatar')).toBeInTheDocument()
  })

  it('renders menu items when HamburgerIcon is clicked', () => {
    renderWithProviders(<Topbar user="testuser" onLoginChange={mockOnLoginChange} />)

    const menuButton = screen.getByTestId('hamburger-menu')
    fireEvent.click(menuButton)

    expect(screen.getByTestId('menu-list')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Chat Histories')).toBeInTheDocument()
    expect(screen.getByText('Data Sets')).toBeInTheDocument()
    expect(screen.getByText('Documents')).toBeInTheDocument()
    expect(screen.getByText('Pipelines')).toBeInTheDocument()
  })

  it('opens Rightbar when avatar is clicked', () => {
    renderWithProviders(<Topbar user="testuser" onLoginChange={mockOnLoginChange} />)

    const avatar = screen.getByTestId('avatar')
    fireEvent.click(avatar)

    expect(screen.getByText('Preferences')).toBeInTheDocument()
  })
})
