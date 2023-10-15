import { Link } from 'react-router-dom'
import { Head } from 'scood/head'

export default function Index() {
  return (
    <div>
      <Head>
        <title>Index</title>
      </Head>
      <h1 className="text-xl">Hello World!</h1>
      <Link to="/foo">Foo</Link>
    </div>
  )
}
