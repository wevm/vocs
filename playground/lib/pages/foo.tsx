import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'

export default function Index() {
  return (
    <div>
      <Helmet>
        <title>Foo</title>
      </Helmet>
      <h1 className="text-xl">Foo</h1>
      <Link to="/">Index</Link>
    </div>
  )
}
