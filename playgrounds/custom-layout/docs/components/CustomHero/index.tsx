import { useConfig } from '../../../../../src/hooks.js'

const CustomHero = () => {
  const config = useConfig()

  return (
    <section>
      <h1>
        <b>Config Title:</b> {config?.title ?? ''}
      </h1>
    </section>
  )
}

export default CustomHero
