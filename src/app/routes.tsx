import { Route, Routes as Routes_ } from 'react-router-dom'
import { pages } from 'virtual:pages'

export function Routes() {
  return (
    <Routes_>
      {pages.map((page) => (
        <Route key={page.path} element={<page.component />} path={page.path} />
      ))}
    </Routes_>
  )
}
