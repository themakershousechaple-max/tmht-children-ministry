import { useEffect, useMemo, useState } from 'react'
import { listAll, deleteRecord } from '../lib/repo'
import { exportCsv as exportLocalCsv } from '../lib/storage'
import { capacity, volunteerCount } from '../lib/config'
import { generateQRCode } from '../lib/qr'
import { sendWhatsAppMessage } from '../lib/whatsapp'
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
  
  useEffect(() => { listAll().then(setRows).catch(()=>{}) }, [])

  const checkedIn = useMemo(() => rows.filter(r => !r.pickUpAt), [rows])
  const checkedOut = useMemo(() => rows.filter(r => !!r.pickUpAt), [rows])

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
      const qrDataUrl = await generateQRCode(record.qrUrl)
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

  // Send QR code via WhatsApp
  const sendQRWhatsApp = (record: any) => {
    const message = `🙏 ${record.childName} Pickup Details:\n\n📋 Pickup Code: ${record.code}\n📱 Show this QR code at pickup: ${record.qrUrl}\n\nPlease keep this code secure.\n\n- TMHT Children's Ministry`
    sendWhatsAppMessage({
      phone: record.phone,
      message,
      onSuccess: () => setSent(`QR code sent to ${record.parentName}`),
      onError: (error) => setSent(`Failed to send QR code: ${error.message}`)
    })
  }

  // Delete record functions
  const handleDeleteClick = (record: any) => {
    setDeleteDialog({ isOpen: true, record })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.record) return
    
    setIsDeleting(true)
    const success = await deleteRecord(deleteDialog.record.id)
    
    if (success) {
      // Remove from local state
      setRows(prev => prev.filter(r => r.id !== deleteDialog.record.id))
      // Remove QR code if exists
      setQrCodes(prev => {
        const newQrCodes = { ...prev }
        delete newQrCodes[deleteDialog.record.id]
        return newQrCodes
      })
      setSent(`Successfully deleted ${deleteDialog.record.childName}`)
    } else {
      setSent('Failed to delete record')
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

  async function copySummary() {
    const summary = 'Checked-In: ' + checkedIn.length + ' / ' + capacity() + ' • Checked-Out: ' + checkedOut.length + ' • Volunteers: ' + volunteerCount()
    try { await navigator.clipboard.writeText(summary); setSent('Summary copied') } catch { setSent('Unable to copy summary') }
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
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-300">Checked-In</div>
          <div className="text-xl font-bold">{checkedIn.length} / {capacity()}</div>
        </div>
        <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-300">Checked-Out</div>
          <div className="text-xl font-bold">{checkedOut.length}</div>
        </div>
      </div>
      <div className="mt-2">
        <div className="p-2.5 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-300">Total Records</div>
          <div className="text-xl font-bold">{rows.length}</div>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        <button className="px-3 py-2 bg-blue-600 text-white rounded-lg border border-blue-600 hover:bg-blue-700 active:bg-white active:text-blue-600 transition-colors text-sm" onClick={exportCsv}>Export CSV</button>
        <button className="px-3 py-2 bg-gray-200 rounded-lg border hover:bg-gray-300 active:bg-white transition-colors dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700 text-sm" onClick={copySummary}>Copy Summary</button>
        {!!sent && <div className="text-xs text-emerald-700 dark:text-emerald-400">{sent}</div>}
      </div>

      {/* QR Codes Section */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Pickup Codes & QR Codes</h2>
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, phone, or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
            />
          </div>
        </div>

        <div className="grid gap-3 max-h-80 overflow-y-auto hide-scrollbar">
          {filteredRecords.map((record) => (
            <div key={record.id} className="p-3 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{record.childName}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {record.parentName} • {record.phone}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Code: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{record.code}</span>
                  </p>
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
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-1"
                    title="Delete this record"
                  >
                    <IconClose size={14} />
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
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadQRCode(record)}
                          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <IconDownload size={16} />
                          Download QR
                        </button>
                        <button
                          onClick={() => sendQRWhatsApp(record)}
                          className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                          <IconMessageCircle size={16} />
                          Send via WhatsApp
                        </button>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Scan this QR code at pickup to verify {record.childName}
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => generateQRForRecord(record)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                  >
                    Generate QR Code
                  </button>
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
        title="Delete Check-in Record"
        message="Are you sure you want to delete this check-in record? This will remove it from both local storage and Supabase."
        itemName={deleteDialog.record?.childName}
        isLoading={isDeleting}
      />
    </div>
  )
}