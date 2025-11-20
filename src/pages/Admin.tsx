import { useEffect, useMemo, useState } from 'react'
import { listAll, deleteRecord, updateRecord } from '../lib/repo'
import { exportCsv as exportLocalCsv } from '../lib/storage'
import { capacity, volunteerCount } from '../lib/config'
import { generateQRCode, generateChildQRCode } from '../lib/qr'
import { sendWhatsAppMessage } from '../lib/whatsapp'
import { sendSMSMessage, sendSMSWithQRCode } from '../lib/sms'
import { getRecentlyReleased, ReleasedChild } from '../lib/released'
import WhatsAppMessenger from '../components/WhatsAppMessenger'
import DeleteConfirmationDialog from '../components/DeleteConfirmationDialog'
import { IconSearch, IconDownload, IconMessageCircle, IconClose } from '../components/icons'

export default function Admin() {
  const [rows, setRows] = useState<any[]>([])
  const [sent, setSent] = useState('')
  const [qrCodes, setQrCodes] = useState<{[key: string]: string}>({})
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [deleteDialog, setDeleteDialog] = useState<{isOpen: boolean, record: any | null}>({ isOpen: false, record: null })
  const [isDeleting, setIsDeleting] = useState(false)
  const [classroomOptions, setClassroomOptions] = useState(["Nursery", "Toddlers", "K-2nd Grade", "3rd-5th Grade", "Youth", "Special Needs"])
  const [showClassroomManager, setShowClassroomManager] = useState(false)
  const [newClassroom, setNewClassroom] = useState('')
  const [releasedChildren, setReleasedChildren] = useState<ReleasedChild[]>([])
  const [showReleased, setShowReleased] = useState(false)
  
  useEffect(() => { listAll().then(setRows).catch(()=>{}) }, [])
  useEffect(() => { 
    const released = getRecentlyReleased(24) // Get children released in last 24 hours
    setReleasedChildren(released)
  }, [])

  const refreshReleasedChildren = () => {
    const released = getRecentlyReleased(24)
    setReleasedChildren(released)
    setSent(`Refreshed released children list (${released.length} found)`)
  }

  const checkedIn = useMemo(() => rows.filter(r => !r.pickUpAt), [rows])
  const checkedOut = useMemo(() => rows.filter(r => !!r.pickUpAt), [rows])
  const [showCheckInOut, setShowCheckInOut] = useState(false)
  const [multiSelect, setMultiSelect] = useState(true)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const toggleMultiSelect = () => {}
  const toggleSelectionFor = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return
    setDeleteDialog({ isOpen: true, record: null })
  }

  // Filter records based on search term
  const filteredRecords = useMemo(() => {
    if (!searchTerm) return rows
    return rows.filter(r => 
      r.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(r.phone || '').includes(searchTerm) ||
      r.code.includes(searchTerm)
    )
  }, [rows, searchTerm])

  // Generate QR code for a specific record
  const generateQRForRecord = async (record: any) => {
    try {
      const qrDataUrl = await generateChildQRCode({
        childName: record.childName,
        code: record.code,
        classroom: record.classroom || undefined,
        parentName: record.parentName || undefined,
        timestamp: record.createdAt || new Date().toLocaleString()
      })
      setQrCodes(prev => ({ ...prev, [record.id]: qrDataUrl }))
    } catch (error) {
      console.error('Failed to generate QR code:', error)
    }
  }

  // Download QR code image
  const downloadQRCode = (record: any) => {
    const qrDataUrl = qrCodes[record.id]
    if (!qrDataUrl) return
    
    const link = document.createElement('a')
    link.download = `pickup-${record.childName.replace(/\s+/g, '-').toLowerCase()}-${record.code}.png`
    link.href = qrDataUrl
    link.click()
  }

  // Send QR code via SMS
  const sendQRSMS = async (record: any) => {
    try {
      // Check if we have a QR code for this record
      if (qrCodes[record.id]) {
        // Send SMS with QR code image
        await sendSMSWithQRCode(record.phone, record.childName, record.code, qrCodes[record.id])
        setSent(`QR code SMS opened for ${record.parentName}`)
      } else {
        // Fallback to regular SMS without QR code
        const message = `🙏 ${record.childName} Pickup Details:\n\n📋 Pickup Code: ${record.code}${record.classroom ? `\n🏫 Classroom: ${record.classroom}` : ''}\n\nPlease keep this code secure.\n\n- TMHT Children's Ministry`
        sendSMSMessage(record.phone, message)
        setSent(`SMS opened for ${record.parentName}`)
      }
    } catch (error) {
      setSent(`Could not open SMS. Please check phone permissions.`)
    }
  }

  // Send QR code via WhatsApp
  const sendQRWhatsApp = (record: any) => {
    const message = `🙏 ${record.childName} Pickup Details:\n\n📋 Pickup Code: ${record.code}${record.classroom ? `\n🏫 Classroom: ${record.classroom}` : ''}\n📱 QR Code contains: Child name, pickup code${record.classroom ? ', classroom' : ''}\n\nScan the QR code for complete pickup information.\n\nPlease keep this code secure.\n\n- TMHT Children's Ministry`
    sendWhatsAppMessage({
      phone: record.phone,
      message,
      onSuccess: () => setSent(`QR code sent to ${record.parentName}`),
      onError: (error) => setSent(`Failed to send QR code: ${error.message}`)
    })
  }

  // Classroom management functions
  const addClassroom = () => {
    if (!newClassroom.trim()) return
    if (classroomOptions.includes(newClassroom.trim())) {
      setSent('Classroom already exists')
      return
    }
    setClassroomOptions(prev => [...prev, newClassroom.trim()])
    setNewClassroom('')
    setSent('Classroom added successfully')
  }

  const removeClassroom = (classroom: string) => {
    setClassroomOptions(prev => prev.filter(c => c !== classroom))
    setSent('Classroom removed successfully')
  }
  const handleClassroomChange = async (recordId: string, newClassroom: string) => {
    try {
      const success = await updateRecord(recordId, { serviceTime: newClassroom })
      if (success) {
        setRows(prev => prev.map(r => r.id === recordId ? { ...r, serviceTime: newClassroom } : r))
        setSent(`Classroom updated successfully`)
      } else {
        setSent('Failed to update classroom')
      }
    } catch (error) {
      console.error('Failed to update classroom:', error)
      setSent('Failed to update classroom')
    }
  }
  const handleDeleteClick = (record: any) => {
    setDeleteDialog({ isOpen: true, record })
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    if (deleteDialog.record) {
      const success = await deleteRecord(deleteDialog.record.id)
      if (success) {
        setRows(prev => prev.filter(r => r.id !== deleteDialog.record!.id))
        setQrCodes(prev => {
          const newQrCodes = { ...prev }
          delete newQrCodes[deleteDialog.record!.id]
          return newQrCodes
        })
        setSent(`Successfully deleted ${deleteDialog.record!.childName}`)
      } else {
        setSent('Failed to delete record')
      }
    } else if (selectedIds.length) {
      try {
        for (const id of selectedIds) {
          await deleteRecord(id)
        }
        setRows(prev => prev.filter(r => !selectedIds.includes(r.id)))
        setSelectedIds([])
        setSent(`Deleted ${selectedIds.length} record(s)`) 
      } catch (error) {
        setSent('Failed to delete selected records')
      }
    }
    setIsDeleting(false)
    setDeleteDialog({ isOpen: false, record: null })
  }

  const handleDeleteCancel = () => {
    setDeleteDialog({ isOpen: false, record: null })
  }

  async function exportCsv() {
    const all = await listAll().catch(()=>[])
    if (!all.length) return exportLocalCsv()
    const header = ['Child Name','Parent Name','Phone','Service Time','Code','QR URL','Check-In','Pick-Up','Notes']
    const lines = [header.join(',')].concat(all.map(r => [r.childName, r.parentName, r.phone, r.serviceTime || '', r.code, r.qrUrl, r.checkInAt, r.pickUpAt || '', r.notes || ''].map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')))
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'checkins.csv'
    a.click()
    URL.revokeObjectURL(url)

    const summary = 'Checked-In: ' + checkedIn.length + ' / ' + capacity() + ' • Checked-Out: ' + checkedOut.length + ' • Volunteers: ' + volunteerCount()
    setSent('Exported CSV. ' + summary)
  }

  return (
    <div className="p-4 mx-auto max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-5xl">
      <style jsx>{`
        /* Hide scrollbars for all devices */
        .hide-scrollbar {
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari and Opera */
        }
      `}</style>
      <div className="text-lg font-semibold">Admin</div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-300">Checked-In</div>
          <div className="text-xl font-bold">{checkedIn.length} / {capacity()}</div>
        </div>
        <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-300">Checked-Out</div>
          <div className="text-xl font-bold">{checkedOut.length}</div>
        </div>
        <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-300">Total Records</div>
          <div className="text-xl font-bold">{rows.length}</div>
        </div>
      </div>

      {/* Status + Classroom (responsive side-by-side) */}
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-blue-800 dark:text-blue-200">
              Check-In/Out Status
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCheckInOut(!showCheckInOut)}
                className="sm:hidden px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-w-[80px]"
              >
                {showCheckInOut ? 'Hide' : 'Show'}
              </button>
              <button 
                onClick={() => setShowCheckInOut(!showCheckInOut)}
                aria-pressed={showCheckInOut}
                className={(showCheckInOut ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-700') + ' relative w-12 h-5 rounded-full transition-colors cursor-pointer hidden sm:inline-flex'}
              >
                <span className={(showCheckInOut ? 'translate-x-7' : 'translate-x-0') + ' absolute top-0.5 left-0.5 w-4 h-4 bg-white dark:bg-gray-100 rounded-full shadow transition-transform'}></span>
              </button>
            </div>
          </div>
          
          {showCheckInOut && (
            <div className="space-y-3">
              {/* Currently Checked-In */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Currently Checked-In ({checkedIn.length})
                  </h4>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Active</span>
                  </div>
                </div>
                {checkedIn.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                    {checkedIn.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700/50 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                          <div>
                            <div className="font-semibold text-emerald-800 dark:text-emerald-100 text-sm">{record.childName}</div>
                            <div className="text-xs text-emerald-600 dark:text-emerald-400">{record.parentName}</div>
                            <div className="text-xs font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-800/30 px-2 py-1 rounded mt-1 inline-block">
                              Code: {record.code}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {new Date(record.checkInAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                          </div>
                          <div className="text-xs text-emerald-500 dark:text-emerald-500 mt-1">
                            {record.classroom && (
                              <span className="bg-emerald-100 dark:bg-emerald-800/30 px-2 py-1 rounded-full text-xs">
                                {record.classroom}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-4 h-4 text-emerald-400">👶</div>
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      No children currently checked in
                    </div>
                    <div className="text-xs text-emerald-500 dark:text-emerald-500 mt-1">
                      Ready to welcome new arrivals!
                    </div>
                  </div>
                )}
              </div>
              
              {/* Recently Checked-Out */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Recently Checked-Out ({checkedOut.length})
                  </h4>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">Completed</span>
                  </div>
                </div>
                {checkedOut.length > 0 ? (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                    {checkedOut.slice(0, 10).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          <div>
                            <div className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{record.childName}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{record.parentName}</div>
                            <div className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/30 px-2 py-1 rounded mt-1 inline-block">
                              Code: {record.code}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            Out: {record.pickUpAt ? new Date(record.pickUpAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'N/A'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            {record.classroom && (
                              <span className="bg-gray-100 dark:bg-gray-800/30 px-2 py-1 rounded-full text-xs">
                                {record.classroom}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800/30 rounded-full flex items-center justify-center mx-auto mb-2">
                      <div className="w-4 h-4 text-gray-400">✅</div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      No recent check-outs
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      All children are currently checked in
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Classroom Management (side column on md+) */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Classroom Management</h2>
            <button 
              onClick={() => setShowClassroomManager(!showClassroomManager)}
              className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-w-[80px]"
            >
              {showClassroomManager ? 'Hide' : 'Manage'}
            </button>
          </div>
          {showClassroomManager && (
            <div className="mt-4 pt-4 border-t dark:border-gray-600">
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add new classroom..."
                    value={newClassroom}
                    onChange={(e) => setNewClassroom(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 dark:text-gray-100 text-sm"
                    onKeyPress={(e) => e.key === 'Enter' && addClassroom()}
                  />
                  <button 
                    onClick={addClassroom}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium min-w-[60px]"
                  >
                    Add
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {classroomOptions.map((classroom) => (
                  <div key={classroom} className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-lg border dark:border-gray-600">
                    <span className="text-sm font-medium">{classroom}</span>
                    <button 
                      onClick={() => removeClassroom(classroom)}
                      className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium min-w-[60px]"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedIds.length >= 2 && (
            <div className="mt-4">
              <button 
                onClick={handleDeleteSelected}
                className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Toolbar removed: Export CSV moved to header menu */}
      {!!sent && <div className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">{sent}</div>}

      {/* Recently Released Children Section */}
      {releasedChildren.length > 0 && (
        <div className="mt-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-amber-800 dark:text-amber-200">
              Recently Released ({releasedChildren.length})
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={refreshReleasedChildren}
                className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors text-sm font-medium dark:bg-amber-800 dark:text-amber-200 dark:hover:bg-amber-700"
              >
                Refresh
              </button>
              <button 
                onClick={() => setShowReleased(!showReleased)}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                {showReleased ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          
          {showReleased && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {releasedChildren.map((child) => (
                <div key={child.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <div>
                    <div className="font-medium text-gray-800 dark:text-gray-100">{child.childName}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {child.parentName} • {child.phone}
                    </div>
                    {child.classroom && (
                      <div className="text-xs text-gray-500 dark:text-gray-500">Classroom: {child.classroom}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Released: {new Date(child.releasedAt).toLocaleTimeString()}
                    </div>
                    <div className="text-xs font-mono text-amber-600 dark:text-amber-400">
                      Code: {child.code}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search Section */}
      <div className="mt-6">
            <div className="flex justify-center mb-4">
          <div className="relative w-full max-w-md">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, phone, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-full bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
            />
          </div>
        </div>

        

        

        <div className="grid gap-3 overflow-y-auto hide-scrollbar" style={{ minHeight: 'calc(100vh - 400px)' }}>
          {filteredRecords.map((record) => (
            <div key={record.id} className={'p-3 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700'}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleSelectionFor(record.id)}
                      role="checkbox"
                      aria-checked={selectedIds.includes(record.id)}
                      className={(selectedIds.includes(record.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-900 text-blue-600 border-gray-400 dark:border-gray-600') + ' hidden sm:flex w-4 h-4 rounded-sm items-center justify-center text-[9px] leading-none'}
                    >
                      {selectedIds.includes(record.id) ? '✓' : ''}
                    </button>
                    <h3 className="font-semibold text-lg">{record.childName}</h3>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {record.parentName} • {record.phone}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Code: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{record.code}</span>
                  </p>
                  {record.serviceTime && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Classroom: <span className="font-medium">{record.serviceTime}</span>
                    </p>
                  )}
                </div>
                <div className="text-right space-y-2">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    !record.pickUpAt 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  }`}>
                    {!record.pickUpAt ? 'Checked In' : 'Picked Up'}
                  </div>
                  <button
                    onClick={() => handleDeleteClick(record)}
                    className="px-4 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-medium min-w-[80px] justify-center"
                    title="Delete this record"
                  >
                    <IconClose size={14} className="hidden sm:inline" />
                    <span className="sm:hidden">Delete</span>
                    <span className="hidden sm:inline">Delete</span>
                  </button>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="mt-3">
                {qrCodes[record.id] ? (
                  <div className="flex items-center gap-4">
                    <img 
                      src={qrCodes[record.id]} 
                      alt={`QR Code for ${record.childName}`}
                      className="w-24 h-24 border rounded-lg"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => downloadQRCode(record)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium min-w-[120px] justify-center"
                        >
                          <IconDownload size={16} />
                          Download QR
                        </button>
                        <button
                          onClick={() => sendQRWhatsApp(record)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium min-w-[140px] justify-center"
                        >
                          <IconMessageCircle size={16} />
                          Send via WhatsApp
                        </button>
                        <button
                          onClick={() => sendQRSMS(record)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium min-w-[120px] justify-center"
                        >
                          <IconMessageCircle size={16} />
                          Send via SMS
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Scan this QR code at pickup to verify {record.childName}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleSelectionFor(record.id)}
                      role="checkbox"
                      aria-checked={selectedIds.includes(record.id)}
                      className={(selectedIds.includes(record.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-gray-900 text-blue-600 border-gray-400 dark:border-gray-600') + ' w-4 h-4 rounded-full flex items-center justify-center text-[9px] leading-none sm:hidden'}
                    >
                      {selectedIds.includes(record.id) ? '✓' : ''}
                    </button>
                    <button
                      onClick={() => generateQRForRecord(record)}
                      className="px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium min-w-[140px]"
                    >
                      Generate QR Code
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              {searchTerm ? 'No records found matching your search.' : 'No check-in records available.'}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialog.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={selectedIds.length ? 'Delete Selected Records' : 'Delete Check-in Record'}
        message={selectedIds.length ? `Are you sure you want to delete ${selectedIds.length} selected record(s)? This action cannot be undone.` : 'Are you sure you want to delete this check-in record? This will remove it from both local storage and Supabase.'}
        itemName={selectedIds.length ? undefined : deleteDialog.record?.childName}
        isLoading={isDeleting}
      />
    </div>
  )
}
