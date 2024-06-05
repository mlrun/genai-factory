import React from 'react'
import './Tabs.css'

type Props = {
  label: string[]
  selected: number
}

const Tabs = ({ label, selected }: Props) => {
  const labels = label
  function tabSelect(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    const x = document.getElementsByClassName('tab')
    let i
    for (i = 0; i < x.length; i++) {
      x[i].classList.remove('selected')
    }

    const target = e.target as HTMLButtonElement
    target.classList.add('selected')
  }

  function clickTab(e: React.SyntheticEvent<HTMLImageElement>) {}

  return (
    <div className={'comp-tabs'}>
      {labels.map((label, index) =>
        index == selected ? (
          <button
            className={'tab selected'}
            key={index}
            onClick={event => {
              tabSelect(event)
            }}
          >
            {label}
          </button>
        ) : (
          <button
            className={'tab'}
            key={index}
            onClick={event => {
              tabSelect(event)
            }}
          >
            {label}
          </button>
        )
      )}
      <div className="indicator">
        <img
          src=""
          onError={event => {
            setTimeout(function () {
              clickTab(event)
            }, 50)
          }}
        />
      </div>
    </div>
  )
}

export default Tabs
