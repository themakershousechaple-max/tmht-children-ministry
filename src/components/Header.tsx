import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconMenu, LogoMark, IconCalendar, IconSearch, IconShield, IconChurch, IconClose } from './icons'
import { exportCsv as exportLocalCsv } from '../lib/storage'
import { listAll } from '../lib/repo'
import { isAuthed, logout } from '../lib/auth'

export default function Header() {
  const loc = useLocation()
  const nav = useNavigate()
  const [open, setOpen] = useState(false)
  const [slide, setSlide] = useState(false)
  const [darkOn, setDarkOn] = useState(() => localStorage.getItem('theme') === 'dark')
  const [rows, setRows] = useState<any[]>([])
  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') closeMenu() }
    document.addEventListener('keydown', onEsc)
    return () => document.removeEventListener('keydown', onEsc)
  }, [])
  useEffect(() => { listAll().then(setRows).catch(()=>{}) }, [])
  function openMenu() { setOpen(true); document.body.style.overflow = 'hidden'; setTimeout(()=>setSlide(true), 0) }
  function closeMenu() { setSlide(false); setTimeout(()=>{ setOpen(false); document.body.style.overflow = '' }, 200) }
  const todayLabel = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  const checkedInCount = rows.filter(r => !r.pickUpAt).length
  return (
    <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b dark:border-gray-800 sticky top-0 z-40 shadow-sm">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-white hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600 transition-colors">
            <LogoMark className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </Link>
          <div className="hidden md:block text-lg font-bold text-gray-800 dark:text-gray-100">SafePick</div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className={"px-4 py-3 text-sm rounded-xl border font-semibold min-w-[90px] flex items-center justify-center " + (loc.pathname === '/dashboard' ? 'bg-blue-600 text-white border-transparent shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 dark:border-gray-600')}>Dashboard</Link>
          <Link to="/admin" className={"px-4 py-3 text-sm rounded-xl border font-semibold min-w-[90px] flex items-center justify-center " + (loc.pathname === '/admin' ? 'bg-blue-600 text-white border-transparent shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100 dark:border-gray-600')}>Admin</Link>
        </div>
        <div className="flex items-center">
          <button aria-label="Menu" className="px-4 py-3 rounded-xl bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 flex items-center gap-2 border border-gray-300 dark:border-gray-600 min-w-[70px] justify-center" onClick={openMenu}>
            <IconMenu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            <span className="hidden sm:inline text-sm font-semibold text-gray-700 dark:text-gray-200">Menu</span>
          </button>
        </div>
      </div>
      {open && createPortal((
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-md" onClick={closeMenu}></div>
          <div className={(slide? 'translate-x-0' : 'translate-x-full') + " absolute right-0 top-0 h-full w-[280px] sm:w-[340px] md:w-[420px] bg-gray-50 dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 transition-transform duration-200"}>
            <div className="h-full flex flex-col">
              <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div className="text-sm font-semibold">Menu</div>
                <button className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 active:bg-blue-600 active:text-white transition-colors dark:bg-gray-800 dark:hover:bg-gray-700" onClick={closeMenu}><IconClose /></button>
              </div>
              <div className="p-4 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl border shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-gray-800 dark:text-gray-100">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 text-blue-600"><IconCalendar /></span>
                    <span>{todayLabel}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white">Selected</span>
                </div>
                <div className="mt-4 text-xs font-semibold text-gray-500">VIEWS</div>
                <div className="mt-2 grid gap-2">
                  <Link to="/dashboard" onClick={closeMenu} className={"flex items-center justify-between px-3 py-2 rounded-xl border shadow-sm bg-white hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 " + (loc.pathname === '/dashboard' ? 'border-blue-300' : 'border-gray-200')}>
                    <span className="flex items-center gap-2 text-gray-800 dark:text-gray-100"><IconSearch /><span>Dashboard</span></span>
                    {loc.pathname === '/dashboard' && <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white">Selected</span>}
                  </Link>
                </div>
                <div className="mt-4 text-xs font-semibold text-gray-500">ACTIONS</div>
                <div className="mt-2 grid gap-2">
                  <button className="flex items-center justify-between px-3 py-2 rounded-xl border shadow-sm bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={()=>{ exportLocalCsv(); closeMenu() }}>
                    <span>Export CSV</span>
                    <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white">Download</span>
                  </button>
                  <button className="flex items-center justify-between px-3 py-2 rounded-xl border shadow-sm bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={()=>{
                    const d = document.documentElement.classList.toggle('dark')
                    localStorage.setItem('theme', d ? 'dark' : 'light')
                    setDarkOn(d)
                  }}>
                    <span>Dark Mode</span>
                    <span className={"text-xs px-2 py-1 rounded " + (darkOn? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800')}>{darkOn? 'On' : 'Off'}</span>
                  </button>
                  {isAuthed() ? (
                    <button className="flex items-center justify-between px-3 py-2 rounded-xl border shadow-sm bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={()=>{ logout(); closeMenu(); nav('/login') }}><span>Logout</span><span className="text-xs px-2 py-1 rounded bg-red-600 text-white">Exit</span></button>
                  ) : (
                    <Link to="/login" onClick={closeMenu} className="flex items-center justify-between px-3 py-2 rounded-xl border shadow-sm bg-white hover:bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"><span>Login</span></Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ), document.body)}
    </div>
  )
}
