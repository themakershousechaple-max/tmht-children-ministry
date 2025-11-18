import { useMemo, useState } from 'react'
import { generateCode } from '../lib/code'
import { RecordItem, RecordInput } from '../types'
import { createRecord } from '../lib/repo'
import { sendSms } from '../lib/sms'
import { ENABLE_SMS } from '../lib/config'
import QR from './QR'
import PrintSlip from './PrintSlip'

function nowIso() { return new Date().toISOString() }

function isValidPhone(v: string) { return /^[0-9\-\s\+]{10,}$/.test(v) }

export default function CheckIn() {
  const [childName, setChildName] = useState('')
  const [parentName, setParentName] = useState('')
  const [phone, setPhone] = useState('')
  const [serviceTime, setServiceTime] = useState('')
  const [notes, setNotes] = useState('')
  const [item, setItem] = useState<RecordItem | null>(null)
  const [error, setError] = useState('')

  const waUrl = useMemo(() => {
    if (!item) return ''
    const text = encodeURIComponent('Pickup Code ' + item.code + ' for ' + item.childName)
    const num = phone.replace(/[^0-9]/g,'')
    return 'https://wa.me/' + num + '?text=' + text
  }, [item, phone])

  const smsUrl = useMemo(() => {
    if (!item) return ''
    const text = encodeURIComponent('Pickup Code ' + item.code + ' for ' + item.childName)
    const num = phone.replace(/[^0-9]/g,'')
    return 'sms:' + num + '?body=' + text
  }, [item, phone])

  async function onGenerate() {
    setError('')
    if (!childName || !parentName || !phone) { setError('Fill required fields') ; return }
    if (!isValidPhone(phone)) { setError('Invalid phone number') ; return }
    const code = generateCode(serviceTime || undefined)
    const url = window.location.origin + '/pickup?code=' + code
    const input: RecordInput = { childName, parentName, phone, serviceTime: serviceTime || undefined, notes: notes || undefined, code, qrUrl: url }
    try {
      const created = await createRecord(input)
      setItem(created)
      const text = 'Pickup Code ' + created.code + ' for ' + created.childName
      if (ENABLE_SMS) await sendSms(phone.replace(/[^0-9]/g,''), text)
    } catch (e: any) {
      setError(String(e.message || e))
    }
  }

  return (
    <div className="p-4 mx-auto max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <div className="grid gap-3">
        <input className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Child name" value={childName} onChange={e=>setChildName(e.target.value)} />
        <input className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Parent/guardian name" value={parentName} onChange={e=>setParentName(e.target.value)} />
        <input className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Phone number" value={phone} onChange={e=>setPhone(e.target.value)} />
        <input className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Service time (optional)" value={serviceTime} onChange={e=>setServiceTime(e.target.value)} />
        <textarea className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Notes (optional)" value={notes} onChange={e=>setNotes(e.target.value)} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={onGenerate}>Generate Code</button>
        {error && <div className="text-red-600 dark:text-red-400">{error}</div>}
      </div>

      {item && (
        <div className="mt-6 grid gap-4">
          <div className="text-3xl font-bold">Code: {item.code}</div>
          <div className="flex items-center gap-4">
            <QR value={item.qrUrl} />
            <div className="grid gap-2">
              <a className="px-3 py-2 bg-emerald-600 text-white rounded" href={waUrl} target="_blank">Send via WhatsApp</a>
              <a className="px-3 py-2 bg-indigo-600 text-white rounded" href={smsUrl}>Send via SMS</a>
              <button className="px-3 py-2 bg-gray-800 text-white rounded" onClick={()=>window.print()}>Print backup slip</button>
            </div>
          </div>
          <div className="print:block hidden">
            <PrintSlip code={item.code} childName={item.childName} parentName={item.parentName} serviceTime={item.serviceTime} />
          </div>
        </div>
      )}
    </div>
  )
}
