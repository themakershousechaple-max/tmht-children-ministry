import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateCode } from '../lib/code'
import { createRecord } from '../lib/repo'
import { generateQRCode } from '../lib/qr'
import { sendWhatsAppMessage, formatPhoneNumber } from '../lib/whatsapp'
import { sendSMSMessage, generateSMSMessage } from '../lib/sms'
import { generatePickupMessage } from '../lib/qr'
import { IconCalendar, IconBack } from '../components/icons'
import CustomSelect from '../components/CustomSelect'

export default function RegisterChild() {
  const nav = useNavigate()
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [dob, setDob] = useState('')
  const [classroom, setClassroom] = useState('')
  const [visitor, setVisitor] = useState(false)
  const [guardian, setGuardian] = useState('')
  const [phone, setPhone] = useState('')
  // Email field removed - phone only
  const [allergies, setAllergies] = useState('')
  const [notes, setNotes] = useState('')
  const [sent, setSent] = useState('')
  const [guardians, setGuardians] = useState<{ name: string, phone: string }[]>([])
  const [showGuardian, setShowGuardian] = useState(false)
  const [gName, setGName] = useState('')
  const [gPhone, setGPhone] = useState('')
  // Guardian email field removed
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [view, setView] = useState<'days'|'monthYear'>('days')
  const now = new Date()
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [calMonth, setCalMonth] = useState(now.getMonth())
  const monthLabel = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][calMonth]
  const firstWeekday = new Date(calYear, calMonth, 1).getDay()
  const totalDays = new Date(calYear, calMonth + 1, 0).getDate()
  function fmt(y: number, m: number, d: number) {
    const mm = String(m + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    return mm + '/' + dd + '/' + y
  }

  const totalSteps = 3
  const step1Done = !!first && !!last
  const step2Done = !!guardian && !!phone && phone.replace(/\D/g, '').length === 10
  const step3Done = !!allergies || !!notes
  const completedSteps = (step1Done?1:0) + (step2Done?1:0) + (step3Done?1:0)
  let currentStep = 1
  if (step1Done) currentStep = 2
  if (step1Done && step2Done) currentStep = 3

  async function onSubmit() {
    try {
      const childName = [first, last].filter(Boolean).join(' ')
      const code = generateCode(classroom || undefined)
      const pickupUrl = window.location.origin + '/pickup?code=' + code
      
      // Generate QR code
      const qrCodeDataUrl = await generateQRCode(pickupUrl)
      
      // Create record with QR code
      await createRecord({ 
        childName, 
        parentName: guardian || '', 
        phone, 
        serviceTime: classroom || undefined, 
        notes: notes || undefined, 
        code, 
        qrUrl: pickupUrl 
      })
      
      // Generate and send messages
      const whatsappMessage = generatePickupMessage(childName, code, pickupUrl)
      const smsMessage = generateSMSMessage(childName, code)
      
      // Send both WhatsApp and SMS messages
      sendWhatsAppMessage({
        phone,
        message: whatsappMessage,
        onSuccess: () => console.log('WhatsApp message sent successfully'),
        onError: (error) => console.error('WhatsApp message failed:', error)
      })
      setTimeout(() => {
        try {
          sendSMSMessage(phone, smsMessage)
        } catch (smsError) {
          console.error('SMS message failed:', smsError)
          // SMS failure is not critical, continue with registration
        }
      }, 1000) // Small delay between messages
      
      // Navigate to success page with all the details
      nav('/registration-success', {
        state: {
          childName,
          pickupCode: code,
          qrCodeDataUrl,
          parentPhone: formatPhoneNumber(phone),
          parentRawPhone: phone
        }
      })
    } catch (error) {
      console.error('Registration error:', error)
      setSent('Registration failed. Please try again.')
    }
  }

  function addGuardian() {
    if (!gName || !gPhone || gPhone.replace(/\D/g, '').length !== 10) return
    const next = guardians.concat({ name: gName, phone: gPhone })
    setGuardians(next)
    setGName('')
    setGPhone('')
    setShowGuardian(false)
  }

  return (
    <div className="p-4 mx-auto max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <div className="flex items-center gap-3">
        <button aria-label="Back" className="p-2 rounded-md border bg-white hover:bg-gray-100 active:bg-blue-600 active:text-white transition-colors transition-transform active:scale-95 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700" onClick={()=>nav(-1)}><IconBack /></button>
        <div className="font-semibold">Register New Child</div>
      </div>
      <div className="sticky top-12 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b dark:border-gray-800">
        <div className="px-1 pt-3 text-sm text-gray-600 dark:text-gray-300">Step {currentStep} of {totalSteps}</div>
        <div className="mt-2 h-1 bg-blue-600 rounded" style={{ width: (completedSteps/totalSteps*100) + '%' }}></div>
      </div>
      <div className="mt-4 text-lg font-semibold">Child's Information</div>
      <div className="mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Enter first name" value={first} onChange={e=>setFirst(e.target.value)} />
          <input className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Enter last name" value={last} onChange={e=>setLast(e.target.value)} />
        </div>
        <div className="mt-3 flex items-center gap-2 px-3 py-2 border rounded bg-white dark:bg-gray-800 dark:border-gray-700">
          <input readOnly className="flex-1 outline-none bg-transparent dark:text-gray-100" placeholder="mm/dd/yyyy" value={dob} onClick={()=>setShowDatePicker(true)} />
          <button className="p-1" onClick={()=>setShowDatePicker(true)}><IconCalendar className="text-gray-500 dark:text-gray-400" /></button>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-lg font-semibold mb-1">Assigned Classroom</div>
        <div className="mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 shadow-sm">
          <CustomSelect value={classroom} onChange={setClassroom} options={["Nursery","Toddlers","K-2nd Grade"]} />
        </div>
      </div>
      <div className="mt-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>First-time Visitor?</div>
          <button aria-pressed={visitor} onClick={()=>setVisitor(v=>!v)} className={(visitor?"bg-blue-600":"bg-gray-300 dark:bg-gray-700") + " relative w-12 h-6 rounded-full transition-colors cursor-pointer"}>
            <span className={(visitor?"translate-x-6":"translate-x-0") + " absolute top-0.5 left-0.5 w-5 h-5 bg-white dark:bg-gray-100 rounded-full shadow transition-transform"}></span>
          </button>
        </div>
      </div>
      <div className="mt-5 text-lg font-semibold">Parent/Guardian Information</div>
      <div className="mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3">
          <input className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Enter full name" value={guardian} onChange={e=>setGuardian(e.target.value)} />
          <input 
            className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" 
            placeholder="(555) 123-4567" 
            value={phone} 
            onChange={e=>setPhone(e.target.value)}
            maxLength={14}
          />
          {phone && phone.replace(/\D/g, '').length !== 10 && (
            <div className="text-xs text-red-600 dark:text-red-400">Phone number must be 10 digits</div>
          )}
        </div>
        <button className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl border border-blue-600 hover:bg-blue-700 active:bg-white active:text-blue-600 w-full transition-colors" onClick={()=>setShowGuardian(true)}>+ Add Another Guardian</button>
        {!!guardians.length && (
          <div className="mt-3">
            {guardians.map((g, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 border rounded mb-2 dark:border-gray-700">
                <div className="text-sm">
                  <div className="font-medium">{g.name}</div>
                  <div className="text-gray-600 dark:text-gray-300">{g.phone}</div>
                </div>
                <button className="text-red-600 text-sm" onClick={()=>setGuardians(guardians.filter((_,idx)=>idx!==i))}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
      {showDatePicker && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <button className="font-semibold px-2 py-1 rounded hover:bg-gray-100 active:bg-blue-600 active:text-white transition-colors dark:hover:bg-gray-700" onClick={()=>setView('monthYear')}>{monthLabel} {calYear}</button>
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 border rounded-md bg-white hover:bg-gray-100 active:bg-blue-600 active:text-white transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={()=>{ const m = calMonth - 1; if (m < 0) { setCalMonth(11); setCalYear(y=>y-1) } else { setCalMonth(m) } }}><span className="inline-flex"><svg viewBox="0 0 24 24" width="1em" height="1em"><path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" fill="none"/></svg></span></button>
                <button className="px-2 py-1 border rounded-md bg-white hover:bg-gray-100 active:bg-blue-600 active:text-white transition-colors dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700" onClick={()=>{ const m = calMonth + 1; if (m > 11) { setCalMonth(0); setCalYear(y=>y+1) } else { setCalMonth(m) } }}><span className="inline-flex"><svg viewBox="0 0 24 24" width="1em" height="1em"><path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" fill="none"/></svg></span></button>
              </div>
            </div>
            {view === 'days' ? (
              <>
                <div className="mt-2 grid grid-cols-7 text-center text-xs text-gray-500 dark:text-gray-400">
                  <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
                </div>
                <div className="mt-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: firstWeekday }).map((_,i) => (<div key={'b'+i} />))}
                  {Array.from({ length: totalDays }).map((_,i) => (
                    <button key={i} className="px-2 py-2 rounded hover:bg-blue-50 dark:hover:bg-gray-700" onClick={()=>{ setDob(fmt(calYear, calMonth, i+1)); setShowDatePicker(false); setView('days') }}>{i+1}</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Month</div>
                    <div className="grid grid-cols-3 gap-2">
                      {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                        <button key={m} className={(i===calMonth? 'bg-blue-600 text-white ' : 'hover:bg-gray-100 dark:hover:bg-gray-700 ') + 'px-2 py-2 rounded'} onClick={()=>setCalMonth(i)}>{m}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Year</div>
                    <div className="max-h-48 overflow-y-auto border rounded bg-gray-50 dark:bg-gray-900 dark:border-gray-700">
                      {Array.from({ length: (now.getFullYear()+25) - (now.getFullYear()-50) + 1 }).map((_,i) => {
                        const y = (now.getFullYear()-50) + i
                        const sel = y === calYear
                        return (
                          <button key={y} className={(sel? 'bg-blue-600 text-white ' : 'hover:bg-gray-100 dark:hover:bg-gray-700 ') + 'block w-full text-left px-3 py-2'} onClick={()=>setCalYear(y)}>{y}</button>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-between">
                  <button className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700" onClick={()=>{ setDob(fmt(calYear, calMonth, 1)); setShowDatePicker(false); }}>Apply</button>
                  <button className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={()=>setShowDatePicker(false)}>Close</button>
                </div>
              </>
            )}
            {view === 'days' && <div className="mt-3 flex justify-end"><button className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700" onClick={()=>setShowDatePicker(false)}>Close</button></div>}
          </div>
        </div>
      )}
      <div className="mt-5 text-lg font-semibold">Health & Safety</div>
      <div className="mt-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 shadow-sm">
        <div className="text-sm text-red-700 dark:text-red-400">Allergies or Medical Conditions</div>
        <textarea className="mt-2 px-3 py-2 border rounded w-full dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" rows={3} placeholder="e.g., Peanut allergy, asthma. Please specify." value={allergies} onChange={e=>setAllergies(e.target.value)} />
      </div>
      <div className="mt-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-4 shadow-sm">
        <div className="text-sm font-semibold">Special Needs or Instructions</div>
        <textarea className="mt-2 px-3 py-2 border rounded w-full dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" rows={3} placeholder="e.g., Needs help with activities, sensitive to loud noises." value={notes} onChange={e=>setNotes(e.target.value)} />
      </div>
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">Your information is stored securely and used only for program purposes.</div>
      <div className="h-24" />
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 p-4 border-t dark:border-gray-800">
        <div className="max-w-md mx-auto">
          <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-xl border border-blue-600 hover:bg-blue-700 active:bg-white active:text-blue-600 transition-colors" onClick={onSubmit}>Complete Registration</button>
          {!!sent && <div className="mt-2 text-emerald-700 dark:text-emerald-400">{sent}</div>}
        </div>
      </div>
      {showGuardian && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
            <div className="text-lg font-semibold">Add Guardian</div>
            <div className="mt-3 grid gap-3">
              <input className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" placeholder="Full name" value={gName} onChange={e=>setGName(e.target.value)} />
              <input 
                className="px-3 py-2 border rounded dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100" 
                placeholder="Phone number" 
                value={gPhone} 
                onChange={e=>setGPhone(e.target.value)}
                maxLength={14}
              />
              {gPhone && gPhone.replace(/\D/g, '').length !== 10 && (
                <div className="text-xs text-red-600 dark:text-red-400">Phone number must be 10 digits</div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 px-4 py-2 border rounded dark:border-gray-700" onClick={()=>setShowGuardian(false)}>Cancel</button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded" onClick={addGuardian}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
