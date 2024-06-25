export const selectFunc = (sid: string) => {
  const x = document.getElementsByClassName('inner-button')
  let i
  for (i = 0; i < x.length; i++) {
    x[i].classList.remove('selected')
  }
  const element = document.getElementById(`chat-${sid}`)
  if (element) {
    element.classList.add('selected')
  }
}

export const generateSessionId = () =>
  Math.floor(Math.random() * 1000000).toString()

