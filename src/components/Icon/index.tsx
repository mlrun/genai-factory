import { ComponentType, FC, lazy, Suspense } from 'react'

type IconProps = {
  name: string
  width?: number
  height?: number
}

const Icon: FC<IconProps> = ({ name, width = 24, height = 24 }) => {
  const LazySvg = lazy<ComponentType<React.SVGProps<SVGSVGElement>>>(() =>
    import(`@icons/${name}.svg`).then(module => ({ default: module.ReactComponent }))
  )

  return (
    <Suspense fallback={<span>Loading...</span>}>
      <LazySvg width={width} height={height} />
    </Suspense>
  )
}

export default Icon
