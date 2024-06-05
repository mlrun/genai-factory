import { useContext } from 'react'
import { AppContext } from '../../services/AppContext'
import './Modal.css'

type Props = {
  title: string
  content: string
  mainFunc: () => void
}
const Modal = (props: Props) => {
  const { setModal } = useContext(AppContext)
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
