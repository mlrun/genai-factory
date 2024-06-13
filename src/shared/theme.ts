import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

const breakpoints = {
  base: '0px',
  sm: '320px',
  md: '768px',
  lg: '960px',
  xl: '1200px',
  '2xl': '1536px',
}
export const colors = {
  topbarDark: '#1A202C',
  topbarLight: '#EDF2F7',
  sidebarDark: '#2D3748',
  sidebarLight: '#E2E8F0',
}

const theme = extendTheme({ config, breakpoints, colors })

export default theme


