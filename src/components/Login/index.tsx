import React, { useState } from 'react'
import { useContext } from 'react'
import './Login.css'
import Logo from '@assets/mlrun.png'
import AppContext from '@services/AppContext'
import Button from '@components/Button'
import Input from '@components/Input'

const Login = () => {
  const { setUsername, admin, setAdmin } = useContext(AppContext)
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
