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
  topbarLight: '#E2E8F0',
  sidebarDark: '#2D3748',
  sidebarLight: '#EDF2F7',

  primary: '#007BFF',
  primaryLight: '#17A2B8',
  secondary: '#6C757D',
  success: '#28A745',
  info: '#17A2B8',
  warning: '#FFC107',
  danger: '#DC3545',
  light: '#F8F9FA',
  dark: '#343A40',

  gray100: '#F7FAFC',
  gray200: '#EDF2F7',
  gray300: '#E2E8F0',
  gray400: '#CBD5E0',
  gray500: '#A0AEC0',
  gray600: '#718096',
  gray700: '#4A5568',
  gray800: '#2D3748',
  gray900: '#1A202C',
}


const theme = extendTheme({ config, breakpoints, colors })

export default theme
