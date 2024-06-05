import './Textarea.css'

type Props = {
  header: string
  content: string
  placetext: string
}
const Textarea = (props: Props) => {
  return (
    <div className="comp-textarea">
      <h3>{props.header}</h3>
      <p>{props.content}</p>
      <div className="textarea-div">
        <textarea placeholder={props.placetext} />
      </div>
    </div>
  )
}

export default Textarea
