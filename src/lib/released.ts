import { RecordItem } from '../types'

export interface ReleasedChild {
  id: string
  childName: string
  parentName: string
  phone: string
  code: string
  classroom?: string
  releasedAt: string
  checkInAt: string
}

const RELEASED_KEY = 'released_children'

export function addReleasedChild(record: RecordItem): void {
  const released = getReleasedChildren()
  const releasedChild: ReleasedChild = {
    id: record.id,
    childName: record.childName,
    parentName: record.parentName,
    phone: record.phone,
    code: record.code,
    classroom: record.serviceTime,
    releasedAt: new Date().toISOString(),
    checkInAt: record.checkInAt,
  }
  
  // Add to beginning of array (most recent first)
  released.unshift(releasedChild)
  
  // Keep only last 50 released children to prevent storage bloat
  const trimmed = released.slice(0, 50)
  
  localStorage.setItem(RELEASED_KEY, JSON.stringify(trimmed))
}

export function getReleasedChildren(): ReleasedChild[] {
  try {
    const stored = localStorage.getItem(RELEASED_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function getRecentlyReleased(hours: number = 24): ReleasedChild[] {
  const released = getReleasedChildren()
  const cutoffTime = new Date()
  cutoffTime.setHours(cutoffTime.getHours() - hours)
  
  return released.filter(child => new Date(child.releasedAt) > cutoffTime)
}

export function clearReleasedChildren(): void {
  localStorage.removeItem(RELEASED_KEY)
}