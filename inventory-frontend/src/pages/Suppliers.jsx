import { useState, useEffect } from 'react'
import { apiFetch } from '../api/api'
import Modal from '../components/Modal'
import { LuPlus, LuPencil, LuTrash2, LuSearch, LuTruck } from 'react-icons/lu'

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', address: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      setSuppliers(await apiFetch('/suppliers/'))
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = suppliers.filter(s =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.company && s.company.toLowerCase().includes(search.toLowerCase()))
  )

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', company: '', email: '', phone: '', address: '' })
    setModalOpen(true)
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({ name: s.name, company: s.company || '', email: s.email || '', phone: s.phone || '', address: s.address || '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const body = {
        name: form.name,
        company: form.company || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
      }
      if (editing) {
        await apiFetch(`/suppliers/${editing.supplier_id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await apiFetch('/suppliers/', { method: 'POST', body: JSON.stringify(body) })
      }
      setModalOpen(false)
      loadData()
    } catch (err) { alert(err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this supplier?')) return
    try {
      await apiFetch(`/suppliers/${id}`, { method: 'DELETE' })
      loadData()
    } catch (err) { alert(err.message) }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <h1>Suppliers</h1>
        <button className="btn btn-primary" onClick={openCreate}><LuPlus size={18} /> Add Supplier</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <LuSearch className="search-icon" />
            <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>{filtered.length} suppliers</span>
        </div>
        <table>
          <thead>
            <tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Address</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6}><div className="empty-state"><div className="empty-icon"><LuTruck /></div><p>No suppliers found</p></div></td></tr>
            ) : (
              filtered.map(s => (
                <tr key={s.supplier_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                  <td>{s.company || '-'}</td>
                  <td>{s.email || '-'}</td>
                  <td>{s.phone || '-'}</td>
                  <td>{s.address ? s.address.substring(0, 30) + (s.address.length > 30 ? '...' : '') : '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(s)}><LuPencil size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(s.supplier_id)} style={{ color: 'var(--danger)' }}><LuTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Supplier' : 'Add Supplier'}
        footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Supplier name" />
          </div>
          <div className="form-group">
            <label className="form-label">Company</label>
            <input className="form-input" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} placeholder="Company name" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+94 7X XXX XXXX" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Address</label>
          <textarea className="form-textarea" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Supplier address" />
        </div>
      </Modal>
    </>
  )
}
