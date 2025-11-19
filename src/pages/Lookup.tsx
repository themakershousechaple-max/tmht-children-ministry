import { useEffect, useMemo, useState } from 'react'
import { listAll, releaseById } from '../lib/repo'
import { addReleasedChild } from '../lib/released'
import { IconSearch, IconShield } from '../components/icons'

export default function Lookup() {
  const [rows, setRows] = useState<any[]>([])
  const [tab, setTab] = useState<'in'|'out'>('in')
  const [query, setQuery] = useState('')
  useEffect(() => { listAll().then(setRows).catch(()=>{}) }, [])
  const filtered = useMemo(() => rows.filter(r => (tab==='in'? !r.pickUpAt : !!r.pickUpAt) && (r.childName.toLowerCase().includes(query.toLowerCase()) || r.code.includes(query))), [rows, tab, query])

  return (
    <div className="p-4 mx-auto max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold">Child Look-up</div>
        <div className="w-6 h-6 rounded bg-gray-300 dark:bg-gray-700"></div>
      </div>
      <div className="mt-3 flex items-center gap-2 px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700">
        <IconSearch className="text-gray-400 dark:text-gray-500" />
        <input className="flex-1 outline-none bg-transparent dark:text-gray-100" placeholder="Search by Name or Check-in Code" value={query} onChange={e=>setQuery(e.target.value)} />
      </div>
      <div className="mt-3 flex gap-6 text-sm">
        <button className={"pb-2 border-b-2 " + (tab==='in'?"border-blue-600":"border-transparent text-gray-500 dark:text-gray-400")} onClick={()=>setTab('in')}>Checked In ({rows.filter(r=>!r.pickUpAt).length})</button>
        <button className={"pb-2 border-b-2 " + (tab==='out'?"border-blue-600":"border-transparent text-gray-500 dark:text-gray-400")} onClick={()=>setTab('out')}>Checked Out ({rows.filter(r=>r.pickUpAt).length})</button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {filtered.map(r => (
          <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <img src="/images/avatar.svg" className="w-10 h-10" loading="lazy" />
              <div className="flex-1">
                <div className="font-semibold">{r.childName}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Nursery</div>
              </div>
              <span className="w-2 h-2 rounded-full " style={{backgroundColor: r.pickUpAt? '#e5e7eb':'#34d399'}}></span>
            </div>
            {!!r.notes && <div className="mt-3 text-sm bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 px-3 py-2 rounded text-yellow-800 dark:text-yellow-100">Note: {r.notes}</div>}
            <div className="mt-3 text-sm font-semibold">Guardian</div>
            <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{r.parentName}</div>
            {!!r.phone && <div className="mt-1 text-sm text-gray-700 dark:text-gray-300">{r.phone}</div>}
            <div className="mt-4">
              {!r.pickUpAt ? (
                <button className="px-4 py-3 bg-blue-600 text-white rounded-xl border border-blue-600 hover:bg-blue-700 active:bg-white active:text-blue-600 transition-colors flex items-center gap-2" onClick={()=>{
                  releaseById(r.id).then(u=>{
                    setRows(rows.map(x=>x.id===r.id?u:x))
                    // Track the released child
                    addReleasedChild(r)
                  })
                }}><IconShield className="text-white" /><span>Verify & Check-out</span></button>
              ) : (
                <div className="text-emerald-700 dark:text-emerald-400">Checked-out</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}