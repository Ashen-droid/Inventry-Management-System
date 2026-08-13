import { useState, useEffect } from 'react'
import { apiFetch } from '../api/api'
import Modal from '../components/Modal'
import { LuPlus, LuPencil, LuTrash2, LuSearch, LuUsers } from 'react-icons/lu'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', phone: '', email: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setCustomers(await apiFetch('/customers/'))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = customers.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone && c.phone.includes(search))
  )

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', phone: '', email: '' })
    setModalOpen(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name, phone: c.phone || '', email: c.email || '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const body = { name: form.name, phone: form.phone || null, email: form.email || null }
      if (editing) {
        await apiFetch(`/customers/${editing.customer_id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await apiFetch('/customers/', { method: 'POST', body: JSON.stringify(body) })
      }
      setModalOpen(false)
      loadData()
    } catch (err) { alert(err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return
    try {
      await apiFetch(`/customers/${id}`, { method: 'DELETE' })
      loadData()
    } catch (err) { alert(err.message) }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <h1>Customers</h1>
        <button className="btn btn-primary" onClick={openCreate}><LuPlus size={18} /> Add Customer</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <LuSearch className="search-icon" />
            <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>{filtered.length} customers</span>
        </div>
        <table>
          <thead>
            <tr><th>Name</th><th>Phone</th><th>Email</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4}><div className="empty-state"><div className="empty-icon"><LuUsers /></div><p>No customers found</p></div></td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.customer_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                  <td>{c.phone || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)}><LuPencil size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(c.customer_id)} style={{ color: 'var(--danger)' }}><LuTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}
        footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}
      >
        <div className="form-group">
          <label className="form-label">Customer Name *</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Customer name" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+94 7X XXX XXXX" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          </div>
        </div>
      </Modal>
    </>
  )
}
