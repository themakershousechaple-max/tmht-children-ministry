export function sendWhatsAppMessage(phone: string, message: string): void {
  // Remove any non-digit characters from phone number
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message)
  
  // Create WhatsApp URL
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`
  
  // Open in new tab/window
  window.open(whatsappUrl, '_blank')
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