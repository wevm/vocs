import { Route, Routes } from 'react-router-dom'
import { pages } from './pages.js'

export function App() {
  return (
    <Routes>
      {pages().map((page) => (
        <Route key={page.path} element={<page.component />} path={page.path} />
      ))}
    </Routes>
  )
}
