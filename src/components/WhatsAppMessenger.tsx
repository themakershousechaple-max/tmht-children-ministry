import { useState } from 'react'
import { sendWhatsAppMessage, createWhatsAppDirectLink, isWhatsAppAvailable } from '../lib/whatsapp'
import { IconMessageCircle, IconExternalLink } from './icons'

interface WhatsAppMessengerProps {
  phone: string
  message: string
  buttonText?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export default function WhatsAppMessenger({ 
  phone, 
  message, 
  buttonText = 'Send via WhatsApp',
  variant = 'primary',
  size = 'md',
  onSuccess,
  onError 
}: WhatsAppMessengerProps) {
  const [isSending, setIsSending] = useState(false)
  const [showQR, setShowQR] = useState(false)

  const handleSend = () => {
    setIsSending(true)
    
    sendWhatsAppMessage({
      phone,
      message,
      onSuccess: () => {
        setIsSending(false)
        onSuccess?.()
      },
      onError: (error) => {
        setIsSending(false)
        onError?.(error)
      }
    })
  }

  const handleCopyLink = async () => {
    try {
      const link = createWhatsAppDirectLink(phone, message)
      await navigator.clipboard.writeText(link)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy link:', error)
    }
  }

  const buttonClass = `
    inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors
    ${size === 'sm' ? 'px-3 py-2 text-sm' : size === 'lg' ? 'px-6 py-3 text-lg' : 'px-4 py-2'}
    ${
      variant === 'primary' 
        ? 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
        : variant === 'secondary'
        ? 'bg-gray-600 text-white hover:bg-gray-700 active:bg-gray-800'
        : 'border border-green-600 text-green-600 hover:bg-green-50 active:bg-green-100'
    }
    ${isSending ? 'opacity-75 cursor-not-allowed' : ''}
  `

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={handleSend}
          disabled={isSending}
          className={buttonClass}
        >
          <IconMessageCircle size={size === 'lg' ? 20 : size === 'sm' ? 16 : 18} />
          {isSending ? 'Opening WhatsApp...' : buttonText}
        </button>
        
        <button
          onClick={handleCopyLink}
          className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="Copy WhatsApp link"
        >
          <IconExternalLink size={16} />
        </button>
      </div>

      {!isWhatsAppAvailable() && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> WhatsApp works best on mobile devices. 
            On desktop, make sure WhatsApp Web is set up.
          </p>
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">
        This will open WhatsApp directly with the parent's number and pre-filled message
      </div>
    </div>
  )
}