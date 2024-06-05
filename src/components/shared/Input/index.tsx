import './Input.css'

type Props = {
  content: string
  type: string
  placetext: string
  value?: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  header?: string
}
const Input = (props: Props) => {
  return (
    <div className="comp-input">
      <h3>{props.header}</h3>
      <p>{props.content}</p>
      <input type={props.type} placeholder={props.placetext} value={props.value} onChange={props.onChange} />
    </div>
  )
}

export default Input
