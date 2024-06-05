import { Source } from '@shared/types'
import './Sources.css'

type Props = {
  sources: Source[]
}
const Sources = ({ sources }: Props) => {
  return (
    <div className="comp-sources">
      <details className="inner-bubble">
        <summary>Sources:</summary>
        {sources.map(src => (
          <div className="source">
            <img
              height="16"
              width="16"
              src={'https://icons.duckduckgo.com/ip3/' + new URL(src.source).hostname + '.ico'}
            />
            <a href={src.source} target="_blank">
              {src.title}
            </a>
          </div>
        ))}
      </details>
    </div>
  )
}

export default Sources
