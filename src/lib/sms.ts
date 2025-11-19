export function sendSMSMessage(phone: string, message: string): void {
  // Remove any non-digit characters from phone number
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message)
  
  // Create SMS URL (works on most mobile devices)
  const smsUrl = `sms:${cleanPhone}?body=${encodedMessage}`
  
  // Open in new tab/window
  window.open(smsUrl, '_blank')
}

export function generateSMSMessage(childName: string, code: string): string {
  return `TMHT Childrens Ministry: ${childName} checked in successfully! Pickup Code: ${code}. Save this code to pick up your child. Questions? Contact the ministry team.`
}