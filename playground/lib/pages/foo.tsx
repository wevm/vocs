import { Link } from 'react-router-dom'
import { Head } from 'scood/head'

export default function Index() {
  return (
    <div>
      <Head>
        <title>Foo</title>
      </Head>
      <h1 className="text-xl">Foo</h1>
      <Link to="/">Index</Link>
    </div>
  )
}
