import './Button.css'

type Props = {
  label: string
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void
}
const Button = (props: Props) => {
  return (
    <button className="comp-button" onClick={e => props.onClick(e)}>
      {props.label}
    </button>
  )
}

export default Button
