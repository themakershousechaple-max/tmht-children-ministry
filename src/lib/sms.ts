export function sendSMSMessage(phone: string, message: string): void {
  // Remove any non-digit characters from phone number
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message)
  
  // Create SMS URL - try different formats for better compatibility
  let smsUrl: string
  
  // Try with body parameter first (works on most modern devices)
  if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
    // iOS format - use & instead of ? for iOS
    smsUrl = `sms:${cleanPhone}&body=${encodedMessage}`
  } else if (navigator.userAgent.match(/Android/i)) {
    // Android format
    smsUrl = `sms:${cleanPhone}?body=${encodedMessage}`
  } else {
    // Generic format
    smsUrl = `sms:${cleanPhone}?body=${encodedMessage}`
  }
  
  // Try to open SMS app
  try {
    // Method 1: Try location.href (works best on mobile)
    window.location.href = smsUrl
    
    // Method 2: Fallback - create and click a link
    setTimeout(() => {
      if (document.hasFocus()) {
        // If we're still focused, the SMS app might not have opened
        const link = document.createElement('a')
        link.href = smsUrl
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }, 500)
    
  } catch (error) {
    // Final fallback
    console.error('Failed to open SMS:', error)
    // Try copying to clipboard as last resort
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${cleanPhone} - ${message}`)
        .then(() => alert('Phone and message copied to clipboard. Please paste in your SMS app.'))
        .catch(() => alert('Could not open SMS app. Please manually text the code.'))
    }
  }
}

export function generateSMSMessage(childName: string, code: string): string {
  return `TMHT Childrens Ministry: ${childName} checked in successfully! Pickup Code: ${code}. Save this code to pick up your child. Questions? Contact the ministry team.`
}