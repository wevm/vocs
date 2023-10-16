import { Link } from 'react-router-dom'

export const head = <title>Foo</title>

export default function Index() {
  return (
    <div>
      <h1 className="text-xl">Foo</h1>
      <Link to="/">Index</Link>
    </div>
  )
}
