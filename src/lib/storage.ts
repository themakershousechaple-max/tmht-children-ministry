import { RecordItem } from '../types'

const KEY = 'checkins'

export function getRecords(): RecordItem[] {
  const v = localStorage.getItem(KEY)
  if (!v) return []
  try { return JSON.parse(v) as RecordItem[] } catch { return [] }
}

export function setRecords(list: RecordItem[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function addRecord(item: RecordItem) {
  const list = getRecords()
  list.push(item)
  setRecords(list)
}

export function findByCode(code: string): RecordItem | undefined {
  return getRecords().find(r => r.code === code)
}

export function updateById(id: string, patch: Partial<RecordItem>) {
  const list = getRecords()
  const i = list.findIndex(r => r.id === id)
  if (i >= 0) {
    list[i] = { ...list[i], ...patch }
    setRecords(list)
    return list[i]
  }
}

export function countByService(service?: string) {
  return getRecords().filter(r => r.serviceTime === service).length
}

export function exportCsv() {
  const rows = getRecords()
  const header = ['Child Name','Parent Name','Phone','Service Time','Code','QR URL','Check-In','Pick-Up','Notes']
  const lines = [header.join(',')].concat(rows.map(r => [r.childName, r.parentName, r.phone, r.serviceTime || '', r.code, r.qrUrl, r.checkInAt, r.pickUpAt || '', r.notes || ''].map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')))
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'checkins.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function deleteRecord(id: string): boolean {
  try {
    const list = getRecords()
    const filteredList = list.filter(r => r.id !== id)
    if (filteredList.length === list.length) {
      return false // Record not found
    }
    setRecords(filteredList)
    return true
  } catch (error) {
    console.error('Failed to delete local record:', error)
    return false
  }
}