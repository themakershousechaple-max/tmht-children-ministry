import { countByService, getRecords } from './storage'

function randomDigits(len: number) {
  const max = Math.pow(10, len) - 1
  const min = Math.pow(10, len - 1)
  return String(Math.floor(Math.random() * (max - min + 1)) + min)
}

export function generateCode(service?: string) {
  const count = countByService(service)
  const len = 4
  const used = new Set(getRecords().filter(r => r.serviceTime === service).map(r => r.code))
  let code = randomDigits(len)
  while (used.has(code)) code = randomDigits(len)
  return code
}