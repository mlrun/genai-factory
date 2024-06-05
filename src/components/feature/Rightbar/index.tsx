import Dropdown from '@components/shared/Dropdown'
import Icon from '@components/shared/Icon'
import Input from '@components/shared/Input'
import Paragraph from '@components/shared/Paragraph'
import Slider from '@components/shared/Slider'
import Textarea from '@components/shared/Textarea'
import './Rightbar.css'

const Rightbar = () => {
  return (
    <div className="comp-rightbar">
      <div className="indicator" onClick={e => (e.target as HTMLElement).parentElement!.classList.toggle('open')}></div>
      <div className="title">Properties</div>
      <div className="inner-elements">
        <Paragraph
          header="Paragraph component"
          content="Bibendum vehicula aenean parturient blandit aliquam. Amet ipsum turpis integer gravida pulvinar aenean dictumst faucibus."
        />
        <Input
          onChange={e => console.log(e)}
          type="text"
          header="Input component"
          content="Please type name"
          placetext="Placeholder only"
        />
        <Dropdown
          onChange={e => console.log(e)}
          header="Dropdown component"
          content="Please select company"
          option={['Apple', 'Samsung', 'OnePlus', 'Google', 'Xiaomi']}
        />
        <Dropdown
          onChange={e => console.log(e)}
          header="Another dropdown"
          content="What's the best beverage?"
          option={['Water', 'Coke', 'Orange Juice', 'Cider', 'Coffee', 'Tea', 'Chai']}
        />
        <Textarea header="Textarea component" content="Please type description" placetext="Placeholder only" />
        <Slider header="Slider component" content="Values are between 1 and 18" min={1} max={18} />
        <Slider header="Slider component" content="Values are between 1 and 99" min={1} max={99} />
      </div>
    </div>
  )
}

export default Rightbar
