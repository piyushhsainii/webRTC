import './App.css'
import { Route, BrowserRouter, Routes } from 'react-router-dom'
import Sender from './components/User2'
import Receiver from './components/User1'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sender" element={<Sender />} />
        <Route path="/receiver" element={<Receiver />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App