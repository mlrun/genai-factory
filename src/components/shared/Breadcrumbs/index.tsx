import { useContext } from 'react'
import React from 'react'
import './Breadcrumbs.css'

const Breadcrumbs = () => {
  return (
    <div className="comp-breadcrumbs">
      <button>Home</button>
      <div className="seperator"></div>
      <button>Category</button>
      <div className="seperator"></div>
      <button>Page</button>
    </div>
  )
}

export default Breadcrumbs
