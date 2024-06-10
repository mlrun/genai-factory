import { modalAtom } from 'atoms'
import { useAtom } from 'jotai'
import './Modal.css'

type Props = {
  title: string
  content: string
  mainFunc: () => void
}
const Modal = (props: Props) => {
  const [modal, setModal] = useAtom(modalAtom)
  return (
    <div className="comp-modal">
      <div className="modal">
        <h2>{props.title}</h2>
        <p>{props.content}</p>
        <footer>
          <button
            className="second-button"
            onClick={() => {
              setModal(false)
            }}
          >
            Cancel
          </button>
          <button onClick={props.mainFunc}>OK</button>
        </footer>
      </div>
    </div>
  )
}

export default Modal
