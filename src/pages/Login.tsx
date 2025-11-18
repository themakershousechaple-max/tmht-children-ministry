import { useState } from 'react'
import { IconEye, IconChurch, IconMail, IconLock } from '../components/icons'
import { login } from '../lib/auth'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [show, setShow] = useState(false)
  const navigate = useNavigate()

  function onSubmit() {
    const res = login(email, password)
    if (!res.ok) { setError('Invalid email or password'); return }
    navigate('/dashboard')
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-200">
            <IconChurch className="w-8 h-8" />
          </div>
          <div className="text-3xl font-bold">Welcome Back!</div>
          <div className="text-gray-600 dark:text-gray-300">Sign in to manage check-ins.</div>
        </div>
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm">Email Address</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"><IconMail /></span>
              <input className="w-full px-10 py-2 border rounded-lg outline-none bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="your.email@example.com" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500"><IconLock /></span>
              <input type={show? 'text' : 'password'} className="w-full px-10 py-2 border rounded-lg outline-none bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Enter your password" value={password} onChange={e=>setPassword(e.target.value)} />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" onClick={()=>setShow(s=>!s)}><IconEye /></button>
            </div>
          </div>
          <div className="text-right text-sm"><button className="text-blue-600 dark:text-blue-300">Forgot Password?</button></div>
          {!!error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}
          <button className="mt-2 px-4 py-3 bg-blue-600 text-white rounded-lg w-full" onClick={onSubmit}>Log In</button>
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center">Need help? Contact your program coordinator.</div>
        </div>
      </div>
    </div>
  )
}