import { Helmet } from 'react-helmet'
import { Link } from 'react-router-dom'

export default function Index() {
  return (
    <div>
      <Helmet>
        <title>Index</title>
      </Helmet>
      <h1 className="text-xl">Hello World!</h1>
      <Link to="/foo">Foo</Link>
    </div>
  )
}
