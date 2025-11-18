import { useEffect, useMemo, useState } from 'react'
import { listAll, subscribeToCheckIns } from '../lib/repo'
import { Link } from 'react-router-dom'
import { IconSearch } from '../components/icons'

export default function Dashboard() {
  const [rows, setRows] = useState<any[]>([])
  const [query, setQuery] = useState('')
  useEffect(() => { listAll().then(setRows).catch(()=>{}) }, [])
  useEffect(() => { const sub = subscribeToCheckIns(() => listAll().then(setRows).catch(()=>{})); return () => sub.unsubscribe() }, [])
  const checkedIn = useMemo(() => rows.filter(r => !r.pickUpAt), [rows])
  const filtered = useMemo(() => checkedIn.filter(r => (
    r.childName.toLowerCase().includes(query.toLowerCase()) ||
    r.parentName.toLowerCase().includes(query.toLowerCase()) ||
    String(r.phone || '').includes(query)
  )), [checkedIn, query])

  return (
    <div className="p-4 mx-auto max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <div className="flex items-center justify-center">
        <div className="text-lg font-semibold">Sunday Service Check-In</div>
      </div>
      <div className="mt-4 grid gap-3">
        <Link to="/register" className="px-4 py-3 bg-blue-600 text-white rounded-xl border border-blue-600 hover:bg-blue-700 active:bg-white active:text-blue-600 transition-colors text-center">Check-In Child</Link>
        <div className="flex items-center gap-2 px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700"><IconSearch className="text-gray-400 dark:text-gray-500" /><input className="flex-1 outline-none bg-transparent dark:text-gray-100" placeholder="Search by name or family..." value={query} onChange={e=>setQuery(e.target.value)} /></div>
      </div>
      <div className="mt-6">
        <div className="font-semibold">Currently Checked-In</div>
                <div className="grid gap-2 mt-2 md:grid-cols-2">
                  {filtered.map(r => (
                    <div key={r.id} className="p-2 md:p-3 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 flex items-center gap-3">
                      <img src="/images/avatar.svg" className="w-8 h-8 md:w-10 md:h-10" loading="lazy" />
                      <div className="flex-1">
                        <div className="font-medium text-sm md:text-base">{r.childName}</div>
                        <div className="hidden md:block text-xs md:text-sm text-gray-600 dark:text-gray-300">Age • Juniors Group</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                        <div className="text-xs md:text-sm text-gray-600 dark:text-gray-300">{new Date(r.checkInAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                      </div>
                    </div>
                  ))}
                </div>
      </div>
    </div>
  )
}