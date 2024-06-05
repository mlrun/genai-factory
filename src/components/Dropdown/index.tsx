import './Dropdown.css'

type Props = {
  header: string
  content: string
  option: string[]
  onChange: (value: string) => void
}
const Dropdown = (props: Props) => {
  const options = props.option

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    props.onChange(event.target.value)
  }

  return (
    <div className="comp-dropdown">
      <h3>{props.header}</h3>
      <p>{props.content}</p>
      <select onChange={handleChange}>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Dropdown
