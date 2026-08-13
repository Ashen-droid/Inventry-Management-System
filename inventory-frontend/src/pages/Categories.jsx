import { useState, useEffect } from 'react'
import { apiFetch } from '../api/api'
import Modal from '../components/Modal'
import { LuPlus, LuPencil, LuTrash2, LuSearch, LuTags } from 'react-icons/lu'

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '' })

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const data = await apiFetch('/categories/')
      setCategories(data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filtered = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', description: '' })
    setModalOpen(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setForm({ name: c.name, description: c.description || '' })
    setModalOpen(true)
  }

  const handleSave = async () => {
    try {
      const body = { name: form.name, description: form.description || null }
      if (editing) {
        await apiFetch(`/categories/${editing.category_id}`, { method: 'PUT', body: JSON.stringify(body) })
      } else {
        await apiFetch('/categories/', { method: 'POST', body: JSON.stringify(body) })
      }
      setModalOpen(false)
      loadData()
    } catch (err) { alert(err.message) }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return
    try {
      await apiFetch(`/categories/${id}`, { method: 'DELETE' })
      loadData()
    } catch (err) { alert(err.message) }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <h1>Categories</h1>
        <button className="btn btn-primary" onClick={openCreate}><LuPlus size={18} /> Add Category</button>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-search">
            <LuSearch className="search-icon" />
            <input type="text" placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>{filtered.length} categories</span>
        </div>
        <table>
          <thead>
            <tr><th>Name</th><th>Description</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={3}><div className="empty-state"><div className="empty-icon"><LuTags /></div><p>No categories found</p></div></td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.category_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                  <td>{c.description || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(c)}><LuPencil size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDelete(c.category_id)} style={{ color: 'var(--danger)' }}><LuTrash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'}
        footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update' : 'Create'}</button></>}
      >
        <div className="form-group">
          <label className="form-label">Category Name *</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Category name" />
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Category description" />
        </div>
      </Modal>
    </>
  )
}
