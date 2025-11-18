import { useEffect, useMemo, useState } from 'react'
import { listAll } from '../lib/repo'
import { exportCsv as exportLocalCsv } from '../lib/storage'
import { capacity, volunteerCount } from '../lib/config'

export default function Admin() {
  const [rows, setRows] = useState<any[]>([])
  const [sent, setSent] = useState('')
  useEffect(() => { listAll().then(setRows).catch(()=>{}) }, [])

  const checkedIn = useMemo(() => rows.filter(r => !r.pickUpAt), [rows])
  const checkedOut = useMemo(() => rows.filter(r => !!r.pickUpAt), [rows])

  async function exportCsv() {
    const all = await listAll().catch(()=>[])
    if (!all.length) return exportLocalCsv()
    const header = ['Child Name','Parent Name','Phone','Service Time','Code','QR URL','Check-In','Pick-Up','Notes']
    const lines = [header.join(',')].concat(all.map(r => [r.childName, r.parentName, r.phone, r.serviceTime || '', r.code, r.qrUrl, r.checkInAt, r.pickUpAt || '', r.notes || ''].map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')))
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'checkins.csv'
    a.click()
    URL.revokeObjectURL(url)

    const summary = 'Checked-In: ' + checkedIn.length + ' / ' + capacity() + ' • Checked-Out: ' + checkedOut.length + ' • Volunteers: ' + volunteerCount()
    setSent('Exported CSV. ' + summary)
  }

  async function copySummary() {
    const summary = 'Checked-In: ' + checkedIn.length + ' / ' + capacity() + ' • Checked-Out: ' + checkedOut.length + ' • Volunteers: ' + volunteerCount()
    try { await navigator.clipboard.writeText(summary); setSent('Summary copied') } catch { setSent('Unable to copy summary') }
  }

  return (
    <div className="p-4 mx-auto max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <div className="text-lg font-semibold">Admin</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">Checked-In</div>
          <div className="text-2xl font-bold">{checkedIn.length} / {capacity()}</div>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">Checked-Out</div>
          <div className="text-2xl font-bold">{checkedOut.length}</div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">Volunteers</div>
          <div className="text-2xl font-bold">{volunteerCount()}</div>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-300">Total Records</div>
          <div className="text-2xl font-bold">{rows.length}</div>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <button className="px-4 py-3 bg-blue-600 text-white rounded-xl border border-blue-600 hover:bg-blue-700 active:bg-white active:text-blue-600 transition-colors" onClick={exportCsv}>Export CSV</button>
        <button className="px-4 py-3 bg-gray-200 rounded-xl border hover:bg-gray-300 active:bg-white transition-colors dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700" onClick={copySummary}>Copy Summary</button>
        {!!sent && <div className="text-sm text-emerald-700 dark:text-emerald-400">{sent}</div>}
      </div>
    </div>
  )
}