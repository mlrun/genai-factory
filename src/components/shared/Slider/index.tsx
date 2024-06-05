import { useState } from 'react'
import './Slider.css'

type Props = {
  header: string
  content: string
  min: number
  max: number
}
const Slider = (props: Props) => {
  const [slider, setSlider] = useState(props.max)
  return (
    <div className="comp-slider">
      <h3>{props.header}</h3>
      <p>{props.content}</p>
      <div className="tooltip" style={{ left: (slider - props.min) * (160 / (props.max - props.min)) + 'px' }}>
        {slider}
      </div>

      <div className="slider-flex">
        <input
          type="range"
          min={props.min}
          max={props.max}
          className="slider"
          value={slider}
          onChange={e => setSlider(parseInt(e.target.value))}
        ></input>
        <input
          type="number"
          className="slider-input"
          min={props.min}
          max={props.max}
          value={slider}
          onChange={e => setSlider(parseInt(e.target.value))}
        />
      </div>
    </div>
  )
}

export default Slider
