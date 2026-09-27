import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Deck from './pages/Deck'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/deck" element={<Deck />} />
    </Routes>
  )
}
