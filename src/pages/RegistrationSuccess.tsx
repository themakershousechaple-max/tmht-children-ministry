import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { IconBack, IconMessageCircle, IconMail } from '../components/icons'
import { generatePickupMessage } from '../lib/qr'
import { sendWhatsAppMessage } from '../lib/whatsapp'
import { sendSMSMessage, generateSMSMessage } from '../lib/sms'

interface LocationState {
  childName: string
  pickupCode: string
  qrCodeDataUrl: string
  parentPhone: string
  parentRawPhone: string
}

export default function RegistrationSuccess() {
  const nav = useNavigate()
  const location = useLocation()
  const [state, setState] = useState<LocationState | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const locationState = location.state as LocationState
    if (!locationState?.pickupCode) {
      nav('/register')
      return
    }
    setState(locationState)
  }, [location.state, nav])

  if (!state) return null

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const downloadQRCode = () => {
    const link = document.createElement('a')
    link.download = `pickup-${state.childName.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = state.qrCodeDataUrl
    link.click()
  }

  const resendWhatsApp = () => {
    const message = generatePickupMessage(state.childName, state.pickupCode, window.location.origin + '/pickup?code=' + state.pickupCode)
    sendWhatsAppMessage(state.parentRawPhone, message)
  }

  const resendSMS = () => {
    const message = generateSMSMessage(state.childName, state.pickupCode)
    sendSMSMessage(state.parentRawPhone, message)
  }

  return (
    <div className="p-4 mx-auto max-w-md">
      <div className="flex items-center gap-3 mb-6">
        <button aria-label="Back" className="p-2 rounded-md border bg-white hover:bg-gray-100 active:bg-blue-600 active:text-white transition-colors transition-transform active:scale-95 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-700" onClick={()=>nav('/dashboard')}>
          <IconBack />
        </button>
        <div className="font-semibold">Registration Complete</div>
      </div>

      <div className="text-center">
        <div className="text-4xl mb-4">✅</div>
        <h1 className="text-xl font-bold text-green-600 dark:text-green-400 mb-2">
          {state.childName} is checked in!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Save these pickup details for when you return
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-6 shadow-sm">
        <div className="text-center mb-4">
          <h2 className="text-lg font-semibold mb-2">Pickup Code</h2>
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 tracking-wider">
            {state.pickupCode}
          </div>
          <button 
            onClick={() => copyToClipboard(state.pickupCode)}
            className="mt-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
        </div>

        <div className="border-t dark:border-gray-700 pt-4">
          <h3 className="text-center font-semibold mb-3">QR Code</h3>
          <div className="flex justify-center mb-3">
            <img 
              src={state.qrCodeDataUrl} 
              alt="Pickup QR Code"
              className="w-48 h-48 border rounded-lg"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={downloadQRCode}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Download QR
            </button>
            <button 
              onClick={() => copyToClipboard(state.qrCodeDataUrl)}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Copy QR Data
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
        <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
          <strong>Important:</strong> This pickup code has been sent to {state.parentPhone} via WhatsApp and SMS. 
          Please present either the code or QR code when picking up your child.
        </p>
        
        <div className="flex gap-2">
          <button 
            onClick={resendWhatsApp}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <IconMessageCircle size={16} />
            Resend WhatsApp
          </button>
          <button 
            onClick={resendSMS}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <IconMail size={16} />
            Resend SMS
          </button>
        </div>
      </div>

      <div className="mt-6">
        <button 
          onClick={() => nav('/dashboard')}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 active:bg-green-800 transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}