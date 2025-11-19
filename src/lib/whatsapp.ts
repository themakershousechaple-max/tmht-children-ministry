export interface WhatsAppMessageOptions {
  phone: string
  message: string
  openInNewTab?: boolean
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function sendWhatsAppMessage(options: WhatsAppMessageOptions): void {
  const { phone, message, openInNewTab = true, onSuccess, onError } = options
  
  try {
    // Remove any non-digit characters from phone number
    const cleanPhone = phone.replace(/\D/g, '')
    
    if (!cleanPhone) {
      throw new Error('Invalid phone number')
    }
    
    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message)
    
    // Create WhatsApp URL - this opens WhatsApp directly with the contact
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
    
    // Open in new tab/window
    const newWindow = window.open(whatsappUrl, openInNewTab ? '_blank' : '_self')
    
    if (!newWindow) {
      throw new Error('Failed to open WhatsApp. Please check your popup blocker settings.')
    }
    
    // Success callback
    onSuccess?.()
    
  } catch (error) {
    console.error('WhatsApp messaging error:', error)
    onError?.(error as Error)
    
    // Fallback: try to open without error handling
    try {
      const cleanPhone = phone.replace(/\D/g, '')
      const encodedMessage = encodeURIComponent(message)
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMessage}`, '_blank')
    } catch (fallbackError) {
      console.error('WhatsApp fallback also failed:', fallbackError)
    }
  }
}

export function createWhatsAppDirectLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')
  
  // Format as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  
  // Return original if not 10 digits
  return phone
}

export function isWhatsAppAvailable(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return false
  
  // Check if user agent suggests mobile device (more likely to have WhatsApp)
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  
  return isMobile
}