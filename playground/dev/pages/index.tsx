import { Link } from 'react-router-dom'

export const head = <title>Index</title>

export default function Index() {
  return (
    <div>
      <h1 className="text-xl">Hello World!</h1>
      <Link to="/foo">Foo</Link>
    </div>
  )
}
