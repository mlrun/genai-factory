import Logo from '@assets/mlrun.png'
import Button from '@components/shared/Button'
import Input from '@components/shared/Input'
import { adminAtom, usernameAtom } from 'atoms'
import { useAtom } from 'jotai'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useAtom(usernameAtom)
  const [admin, setAdmin] = useAtom(adminAtom)
  const [LoginError, setLoginError] = useState('')
  const [formuser, setFormuser] = useState('guest')
  const [password, setPassword] = useState('XxYaz12345')

  function submitFunc(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    console.log('submitting:', formuser)
    if (formuser === 'fail') {
      setLoginError('Incorrect email or password, please enter your sign in information again')
    } else {
      setUsername(formuser)
      if (admin) {
        navigate('/admin')
      } else {
        navigate('/chat')
      }
    }
  }

  return (
    <div className="comp-login">
      <form className="login-flex">
        <div className="logo">
          <img src={Logo} />
        </div>
        <Input
          type="text"
          header="Enter your credentials"
          content="User Name"
          placetext="Enter your user name"
          value={formuser}
          onChange={e => {
            setFormuser(e.target.value)
          }}
        />
        <Input
          type="password"
          content="Password"
          placetext="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        {LoginError ? <div className="failed">{LoginError}</div> : <div></div>}
        <div className="toggle-flex">
          <input type="checkbox" className="toggle" id="mode" checked={admin} onChange={() => setAdmin(!admin)} />
          <label>Admin mode</label>
        </div>
        <Button label="Login" onClick={submitFunc} />
      </form>
    </div>
  )
}

export default Login
