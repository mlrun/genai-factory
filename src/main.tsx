import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from '@components/feature/Login'
import Admin from '@components/feature/Admin'
import Chat from '@components/feature/Chat'
import Leftbar from '@components/feature/Leftbar'
import Rightbar from '@components/feature/Rightbar'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/admin',
    element: <Admin />
  },
  {
    path: '/chat',
    element: (
      <div className="app-flex">
        <Leftbar />
        <Chat />
        <Rightbar />
      </div>
    )
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
