import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

import App from 'App'
import { ColorModeScript } from '@chakra-ui/react'
import theme from '@shared/theme'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ColorModeScript initialColorMode={theme.config.initialColorMode} />
    <App />
  </React.StrictMode>
)
