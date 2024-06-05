import { useContext } from 'react'
import React from 'react'
import './Topbar.css'
import Logo from '@assets/mlrun.png'
import AppContext from '@services/AppContext'

type Props = {
  user: string
  onLoginChange: (value: boolean) => void
}
const Topbar = ({ user, onLoginChange }: Props) => {
  const { admin, setAdmin } = useContext(AppContext)

  return (
    <div className="comp-topbar">
      <div className="logo">
        <img src={Logo} />
      </div>
      <details>
        <summary>
          <div className="icon-button">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
              />
            </svg>

            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6 size-12"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </summary>
        <div className="menu">
          <div className="menu-item disabled username">{user}</div>
          <div className="menu-item">
            <div className="menu-icon settings"></div>
            Settings
          </div>
          <div
            className="menu-item"
            onClick={() => {
              onLoginChange(true)
            }}
          >
            <div className="menu-icon logout"></div>
            Logout
          </div>
        </div>
      </details>
    </div>
  )
}

export default Topbar
