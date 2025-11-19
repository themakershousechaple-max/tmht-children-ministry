import { useEffect, useMemo, useState } from 'react'
import { listAll, subscribeToCheckIns, releaseById } from '../lib/repo'
import { Link } from 'react-router-dom'
import { IconSearch, IconShield } from '../components/icons'
import { addReleasedChild } from '../lib/released'

export default function Dashboard() {
  const [rows, setRows] = useState<any[]>([])
  const [query, setQuery] = useState('')
  useEffect(() => { listAll().then(setRows).catch(()=>{}) }, [])
  useEffect(() => { const sub = subscribeToCheckIns(() => listAll().then(setRows).catch(()=>{})); return () => sub.unsubscribe() }, [])
  const checkedIn = useMemo(() => rows.filter(r => !r.pickUpAt), [rows])
  const filtered = useMemo(() => checkedIn.filter(r => (
    r.childName.toLowerCase().includes(query.toLowerCase()) ||
    r.parentName.toLowerCase().includes(query.toLowerCase()) ||
    String(r.phone || '').includes(query) ||
    r.code.includes(query)
  )), [checkedIn, query])

  const handleCheckout = (record: any) => {
    releaseById(record.id).then(updatedRecord => {
      if (updatedRecord) {
        setRows(rows.map(r => r.id === record.id ? updatedRecord : r))
        addReleasedChild(record)
      }
    })
  }

  return (
    <div className="p-4 mx-auto max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <div className="flex items-center justify-center mt-2 mb-4">
        <div className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">Sunday Service Check-In</div>
      </div>
      <div className="mt-4 grid gap-3">
        <Link to="/register" className="px-4 py-3 bg-blue-600 text-white rounded-xl border border-blue-600 hover:bg-blue-700 active:bg-white active:text-blue-600 transition-colors text-center">Check-In Child</Link>
        <div className="flex items-center gap-2 px-3 py-2 border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700"><IconSearch className="text-gray-400 dark:text-gray-500" /><input className="flex-1 outline-none bg-transparent dark:text-gray-100" placeholder="Search by name, phone, or 4-digit code..." value={query} onChange={e=>setQuery(e.target.value)} /></div>
      </div>
      <div className="mt-6">
        <div className="font-semibold">Currently Checked-In</div>
                <div className="grid gap-2 mt-2 md:grid-cols-2">
                  {filtered.map(r => (
                    <div key={r.id} className="p-3 md:p-4 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src="/images/avatar.svg" className="w-10 h-10 md:w-12 md:h-12" loading="lazy" />
                          <div className="flex-1">
                            <div className="font-semibold text-sm md:text-base">{r.childName}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{r.parentName}</div>
                            <div className="text-xs font-mono text-blue-600 dark:text-blue-400">Code: {r.code}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-xs text-gray-500 dark:text-gray-400">{new Date(r.checkInAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                            <div className="w-2 h-2 bg-emerald-400 rounded-full ml-auto mt-1"></div>
                          </div>
                          <button 
                            onClick={() => handleCheckout(r)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                          >
                            <IconShield className="w-4 h-4" />
                            Check Out
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
      </div>
    </div>
  )
}