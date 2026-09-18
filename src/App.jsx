import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Register from './pages/Register.jsx'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<div className="p-8 text-xl">Login Page</div>} />
      <Route path="/register" element={<Register />} />
      <Route path="/browse" element={<div className="p-8 text-xl">Browse Items</div>} />
    </Routes>
  )
}

export default App
