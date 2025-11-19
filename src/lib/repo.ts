import { supabase } from './db'
import { addRecord, findByCode as lsFindByCode, getRecords, setRecords, updateById, deleteRecord as deleteLocalRecord } from './storage'
import { RecordInput, RecordItem } from '../types'
import { hasSupabase } from './config'

export async function createRecord(input: RecordInput): Promise<RecordItem> {
  if (!hasSupabase() || !supabase) {
    const item: RecordItem = {
      id: crypto.randomUUID(),
      childName: input.childName,
      parentName: input.parentName,
      phone: input.phone,
      serviceTime: input.serviceTime,
      notes: input.notes,
      code: input.code,
      qrUrl: input.qrUrl,
      checkInAt: new Date().toISOString(),
    }
    addRecord(item)
    return item
  }
  const { data, error } = await supabase.from('check_ins').insert({
    child_name: input.childName,
    parent_name: input.parentName,
    phone_number: input.phone,
    service_time: input.serviceTime || null,
    notes: input.notes || null,
    pickup_code: Number(input.code),
    qr_code_url: input.qrUrl,
  }).select('*').single()
  if (error) throw error
  const item: RecordItem = {
    id: data.id,
    childName: data.child_name,
    parentName: data.parent_name,
    phone: data.phone_number,
    serviceTime: data.service_time || undefined,
    notes: data.notes || undefined,
    code: String(data.pickup_code),
    qrUrl: data.qr_code_url,
    checkInAt: data.check_in_time,
    pickUpAt: data.pick_up_time || undefined,
  }
  const list = getRecords()
  list.push(item)
  setRecords(list)
  return item
}

export async function findByCode(code: string): Promise<RecordItem | undefined> {
  if (!hasSupabase() || !supabase) return lsFindByCode(code)
  const { data, error } = await supabase.from('check_ins').select('*').eq('pickup_code', Number(code)).maybeSingle()
  if (error) throw error
  if (!data) {
    return lsFindByCode(code)
  }
  return {
    id: data.id,
    childName: data.child_name,
    parentName: data.parent_name,
    phone: data.phone_number,
    serviceTime: data.service_time || undefined,
    notes: data.notes || undefined,
    code: String(data.pickup_code),
    qrUrl: data.qr_code_url,
    checkInAt: data.check_in_time,
    pickUpAt: data.pick_up_time || undefined,
  }
}

export async function releaseById(id: string): Promise<RecordItem | undefined> {
  if (!hasSupabase() || !supabase) {
    return updateById(id, { pickUpAt: new Date().toISOString() })
  }
  const { data, error } = await supabase.from('check_ins').update({ pick_up_time: new Date().toISOString() }).eq('id', id).select('*').maybeSingle()
  if (error) throw error
  if (!data) {
    return updateById(id, { pickUpAt: new Date().toISOString() })
  }
  return {
    id: data.id,
    childName: data.child_name,
    parentName: data.parent_name,
    phone: data.phone_number,
    serviceTime: data.service_time || undefined,
    notes: data.notes || undefined,
    code: String(data.pickup_code),
    qrUrl: data.qr_code_url,
    checkInAt: data.check_in_time,
    pickUpAt: data.pick_up_time || undefined,
  }
}

export async function listAll(): Promise<RecordItem[]> {
  const local = getRecords()
  if (!hasSupabase() || !supabase) return local
  const { data, error } = await supabase.from('check_ins').select('*').order('check_in_time', { ascending: false })
  if (error) throw error
  const remote: RecordItem[] = data.map((d: any) => ({
    id: d.id,
    childName: d.child_name,
    parentName: d.parent_name,
    phone: d.phone_number,
    serviceTime: d.service_time || undefined,
    notes: d.notes || undefined,
    code: String(d.pickup_code),
    qrUrl: d.qr_code_url,
    checkInAt: d.check_in_time,
    pickUpAt: d.pick_up_time || undefined,
  }))
  const byCode = new Map(remote.map(r => [r.code, true]))
  const merged = remote.concat(local.filter(l => !byCode.get(l.code)))
  merged.sort((a, b) => new Date(b.checkInAt).getTime() - new Date(a.checkInAt).getTime())
  return merged
}

export function subscribeToCheckIns(onChange: (payload: any) => void) {
  if (!hasSupabase() || !supabase) return { unsubscribe: () => {} }
  const channel = supabase
    .channel('check_ins_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'check_ins' }, (payload) => onChange(payload))
    .subscribe()
  return { unsubscribe: () => { supabase!.removeChannel(channel) } }
}

export async function deleteRecord(id: string): Promise<boolean> {
  if (!hasSupabase() || !supabase) {
    deleteLocalRecord(id)
    return true
  }
  
  try {
    const { error } = await supabase.from('check_ins').delete().eq('id', id)
    if (error) throw error
    
    // Also delete from local storage
    deleteLocalRecord(id)
    return true
  } catch (error) {
    console.error('Failed to delete record:', error)
    return false
  }
}
