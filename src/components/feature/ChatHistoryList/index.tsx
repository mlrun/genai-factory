import Modal from '@components/shared/Modal'
import { ChatHistory } from '@shared/types'
import { selectFunc } from '@shared/utils'
import { modalAtom, sessionIdAtom } from 'atoms'
import { useAtom } from 'jotai'
import { useEffect } from 'react'
import './ChatHistoryList.css'

type Props = {
  history: ChatHistory[]
  setNew(newChat: boolean): void
}

const ChatHistoryList = (props: Props) => {
  const [sessionId, setSessionId] = useAtom(sessionIdAtom)
  const [modal, setModal] = useAtom(modalAtom)
  const histories = props.history

  const selectChat = (sid: string) => {
    console.log('MODAL: ', modal)
    console.log('selected chat:', sid, sessionId)
    if (sid === sessionId) {
      return
    }
    selectFunc(sid)
    props.setNew(false)
    setSessionId(sid)
  }

  useEffect(() => {
    selectFunc(sessionId)
  })

  return (
    <div className="comp-history">
      <div className="inner-flex">
        {histories.map((history, index) => (
          <div key={index}>
            <button
              className="inner-button"
              id={`chat-${history.name}`}
              onMouseOver={e => {
                // window.historyTemp = e.target
              }}
              onClick={() => {
                selectChat(history.name as string)
              }}
            >
              {history.description || history.name}
            </button>
            <details>
              <summary>
                <div className="icon-button"></div>
              </summary>
              <div className="menu">
                <div className="menu-item">
                  <div className="menu-icon rename"></div>
                  Rename
                </div>
                <div className="menu-item">
                  <div className="menu-icon pdf"></div>
                  Export to PDF
                </div>
                <div className="menu-item">
                  <div className="menu-icon archive"></div>
                  Archive
                </div>
                <div
                  className="menu-item"
                  onClick={() => {
                    setModal(true)
                  }}
                >
                  <div className="menu-icon delete"></div>
                  Delete
                </div>
              </div>
            </details>
          </div>
        ))}
      </div>
      {modal && (
        <Modal
          title="Delete session"
          content="This will delete the selected session forever and it cannot be undone."
          mainFunc={() => {
            // window.historyTemp.parentElement.outerHTML = ''
            setModal(false)
          }}
        />
      )}
    </div>
  )
}

export default ChatHistoryList
