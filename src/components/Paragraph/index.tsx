import './Paragraph.css'

type Props = {
  header: string
  content: string
}
const Paragraph = (props: Props) => {
  return (
    <div className="comp-paragraph">
      <h3>{props.header}</h3>
      <p>{props.content}</p>
    </div>
  )
}

export default Paragraph
