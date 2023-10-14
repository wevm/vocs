import * as ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Routes } from './routes.js'

ReactDOM.hydrateRoot(
  document.getElementById('app')!,
  <BrowserRouter>
    <Routes />
  </BrowserRouter>,
)
