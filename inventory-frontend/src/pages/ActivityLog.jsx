import { useState, useEffect } from 'react'
import { apiFetch } from '../api/api'
import { LuActivity, LuSearch } from 'react-icons/lu'

export default function ActivityLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('')

  useEffect(() => {
    loadLogs()
  }, [filterAction])

  const loadLogs = async () => {
    try {
      let url = '/activity-log/?limit=100'
      if (filterAction) url += `&action=${filterAction}`
      setLogs(await apiFetch(url))
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getActionBadge = (action) => {
    if (action.includes('CREATE')) return 'badge-success'
    if (action.includes('DELETE')) return 'badge-danger'
    if (action.includes('UPDATE')) return 'badge-info'
    if (action.includes('LOGIN')) return 'badge-warning'
    return 'badge-info'
  }

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <h1>Activity Log</h1>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <select className="form-select" style={{ width: 'auto' }} value={filterAction} onChange={e => setFilterAction(e.target.value)}>
              <option value="">All Actions</option>
              <option value="LOGIN">Login</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
            </select>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
            {logs.length} entries
          </span>
        </div>
        <table>
          <thead>
            <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Details</th></tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={4}><div className="empty-state"><div className="empty-icon"><LuActivity /></div><p>No activity logs found</p></div></td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.user}</td>
                  <td><span className={`badge ${getActionBadge(log.action)}`}>{log.action}</span></td>
                  <td style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
