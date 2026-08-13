import { useState } from 'react'
import { apiFetch } from '../api/api'
import {
  LuBarChart3, LuShoppingCart, LuClipboardList,
  LuPackage, LuTrendingUp, LuDownload
} from 'react-icons/lu'

export default function Reports() {
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
  const [downloading, setDownloading] = useState('')

  const download = async (type, format) => {
    const key = `${type}-${format}`
    setDownloading(key)
    try {
      let url = `/reports/${type}?format=${format}`
      if (type !== 'stock') {
        url += `&start=${startDate}&end=${endDate}`
      }
      const blob = await apiFetch(url)
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      const ext = format === 'excel' ? 'xlsx' : format
      a.download = `${type}_report.${ext}`
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch (err) {
      alert(err.message)
    } finally {
      setDownloading('')
    }
  }

  const reports = [
    {
      title: 'Sales Report',
      desc: 'Detailed breakdown of all sales transactions with totals',
      icon: <LuShoppingCart size={20} style={{ color: 'var(--success)' }} />,
      type: 'sales',
      hasDate: true,
    },
    {
      title: 'Purchase Report',
      desc: 'All purchase orders from suppliers with cost analysis',
      icon: <LuClipboardList size={20} style={{ color: 'var(--info)' }} />,
      type: 'purchases',
      hasDate: true,
    },
    {
      title: 'Stock Report',
      desc: 'Current inventory levels, status, and valuation',
      icon: <LuPackage size={20} style={{ color: 'var(--warning)' }} />,
      type: 'stock',
      hasDate: false,
    },
    {
      title: 'Profit Report',
      desc: 'Revenue, costs, gross profit, and margin analysis',
      icon: <LuTrendingUp size={20} style={{ color: 'var(--accent-primary)' }} />,
      type: 'profit',
      hasDate: true,
    },
  ]

  return (
    <>
      <div className="page-header">
        <h1>Reports</h1>
      </div>

      {/* Date Range */}
      <div className="report-controls">
        <div className="form-group">
          <label className="form-label">Start Date</label>
          <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">End Date</label>
          <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Report Cards */}
      <div className="report-cards">
        {reports.map(r => (
          <div key={r.type} className="report-card">
            <h3>{r.icon} {r.title}</h3>
            <p>{r.desc}</p>
            {r.hasDate && (
              <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Period: {startDate} → {endDate}
              </p>
            )}
            <div className="report-actions">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => download(r.type, 'pdf')}
                disabled={downloading === `${r.type}-pdf`}
              >
                <LuDownload size={14} /> PDF
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => download(r.type, 'excel')}
                disabled={downloading === `${r.type}-excel`}
              >
                <LuDownload size={14} /> Excel
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => download(r.type, 'csv')}
                disabled={downloading === `${r.type}-csv`}
              >
                <LuDownload size={14} /> CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
