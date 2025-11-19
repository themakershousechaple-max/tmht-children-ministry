import { Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header'
import CheckIn from './components/CheckIn'
import PickUp from './components/PickUp'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Lookup from './pages/Lookup'
import RegisterChild from './pages/RegisterChild'
import RegistrationSuccess from './pages/RegistrationSuccess'
import GeneratePickup from './pages/GeneratePickup'
import Admin from './pages/Admin'
import RequireAuth from './components/RequireAuth'

export default function App() {
  const loc = useLocation()
  const isAuth = loc.pathname === '/' || loc.pathname === '/login'
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {!isAuth && <Header />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lookup" element={<Lookup />} />
          <Route path="/register" element={<RegisterChild />} />
          <Route path="/registration-success" element={<RegistrationSuccess />} />
        <Route path="/generate" element={<GeneratePickup />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/pickup" element={<PickUp />} />
        </Route>
      </Routes>
      
    </div>
  )
}