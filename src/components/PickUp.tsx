import { useEffect, useMemo, useState } from 'react'
import { getRecords } from '../lib/storage'
import { findByCode, releaseById, listAll, subscribeToCheckIns } from '../lib/repo'

function useQuery() {
  const params = new URLSearchParams(window.location.search)
  return params
}

function nowIso() { return new Date().toISOString() }

export default function PickUp() {
  const q = useQuery()
  const [term, setTerm] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(undefined)

  useEffect(() => {
    const c = q.get('code')
    if (c) { setTerm(c); lookupWith(c) }
  }, [])

  const [searchList, setSearchList] = useState(() => getRecords())
  useEffect(() => { listAll().then(setSearchList).catch(()=>{}) }, [])

  useEffect(() => {
    const sub = subscribeToCheckIns(() => {
      listAll().then(setSearchList).catch(()=>{})
      if (term) lookupWith(term)
    })
    return () => { sub.unsubscribe() }
  }, [term])
  const filtered = useMemo(() => searchList.filter(r => r.childName.toLowerCase().includes(term.toLowerCase()) || r.code.includes(term)), [searchList, term])

  function lookup() { if (term) lookupWith(term) }

  async function lookupWith(c: string) {
    setError('')
    try {
      const r = await findByCode(c)
      if (!r) { setResult(undefined); setError('Invalid code'); return }
      if (r.pickUpAt) { setResult(r); setError('Code already used'); return }
      setResult(r)
    } catch (e: any) {
      setError(String(e.message || e))
    }
  }

  async function release() {
    if (!result) return
    try {
      const updated = await releaseById(result.id)
      setResult(updated)
    } catch (e: any) {
      setError(String(e.message || e))
    }
  }

  return (
    <div className="p-4 mx-auto max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <div className="bg-white rounded-xl border p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
        <div className="text-sm font-semibold">Find Pickup</div>
        <div className="grid gap-3 mt-2 md:grid-cols-[1fr_auto]">
          <input className="px-3 py-2 border rounded-xl dark:bg-gray-900 dark:border-gray-700" placeholder="Search by name or code" value={term} onChange={e=>setTerm(e.target.value)} />
          <button className="px-4 py-3 bg-blue-600 text-white rounded-xl border border-blue-600 hover:bg-blue-700 active:bg-white active:text-blue-600 transition-colors" onClick={lookup}>Lookup</button>
        </div>
      </div>

      {error && <div className="mt-3 text-red-600 dark:text-red-400">{error}</div>}

      {result && (
        <div className="mt-6 bg-white rounded-xl border p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <div className="text-xl font-semibold">Child: {result.childName}</div>
          <div className="mt-1 text-gray-700 dark:text-gray-300">Parent: {result.parentName}</div>
          <div className="mt-1 text-gray-700 dark:text-gray-300">Service: {result.serviceTime || '-'}</div>
          <div className="mt-1 text-gray-700 dark:text-gray-300">Code: {result.code}</div>
          <div className="mt-1 text-gray-700 dark:text-gray-300">Checked in: {new Date(result.checkInAt).toLocaleString()}</div>
          {result.pickUpAt ? (
            <div className="mt-2 text-emerald-700">Released: {new Date(result.pickUpAt).toLocaleString()}</div>
          ) : (
            <button className="mt-4 px-4 py-3 bg-emerald-600 text-white rounded-xl border border-emerald-600 hover:bg-emerald-700 active:bg-white active:text-emerald-700 transition-colors" onClick={release}>Release Child</button>
          )}
        </div>
      )}

      {!!filtered.length && (
        <div className="mt-6">
          <div className="font-semibold">Matches</div>
          <div className="grid gap-2 md:grid-cols-2">
            {filtered.slice(0,10).map(r => (
              <div key={r.id} className="px-3 py-2 border rounded-xl flex items-center justify-between bg-white dark:bg-gray-800 dark:border-gray-700">
                <div className="leading-none">{r.childName} • {r.code}</div>
                <button className="px-2 py-1 bg-gray-200 rounded-xl border hover:bg-gray-300 active:bg-white transition-colors dark:bg-gray-700 dark:text-gray-100 dark:border-gray-700" onClick={()=>{ setTerm(r.code); lookup() }}>Select</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
