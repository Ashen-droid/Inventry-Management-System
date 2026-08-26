import { useState, useEffect, useRef } from 'react'
import { apiFetch } from '../api/api'
import Modal from '../components/Modal'
import { LuPlus, LuPencil, LuTrash2, LuSearch, LuPackage, LuBarcode, LuQrCode, LuCheck, LuX } from 'react-icons/lu'

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterSup, setFilterSup] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({
    name: '', description: '', price: '', cost_price: '',
    quantity: '', low_stock_threshold: '5', category_id: '', supplier_id: ''
  })
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  const newCatInputRef = useRef(null)

  const [addingSupplier, setAddingSupplier] = useState(false)
  const [newSupplierForm, setNewSupplierForm] = useState({ name: '', company: '' })
  const [savingSupplier, setSavingSupplier] = useState(false)
  const newSupInputRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [p, c, s] = await Promise.all([
        apiFetch('/products/'),
        apiFetch('/categories/'),
        apiFetch('/suppliers/'),
      ])
      setProducts(p)
      setCategories(c)
      setSuppliers(s)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCategoryChange = (e) => {
    if (e.target.value === '__add_new__') {
      setAddingCategory(true)
      setNewCategoryName('')
      setTimeout(() => newCatInputRef.current?.focus(), 50)
    } else {
      setForm({ ...form, category_id: e.target.value })
    }
  }

  const handleSaveNewCategory = async () => {
    if (!newCategoryName.trim()) return
    setSavingCategory(true)
    try {
      const created = await apiFetch('/categories/', {
        method: 'POST',
        body: JSON.stringify({ name: newCategoryName.trim(), description: '' }),
      })
      const updated = await apiFetch('/categories/')
      setCategories(updated)
      setForm({ ...form, category_id: String(created.category_id) })
      setAddingCategory(false)
      setNewCategoryName('')
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingCategory(false)
    }
  }

  const handleCancelNewCategory = () => {
    setAddingCategory(false)
    setNewCategoryName('')
  }

  const handleSupplierChange = (e) => {
    if (e.target.value === '__add_new_sup__') {
      setAddingSupplier(true)
      setNewSupplierForm({ name: '', company: '' })
      setTimeout(() => newSupInputRef.current?.focus(), 50)
    } else {
      setForm({ ...form, supplier_id: e.target.value })
    }
  }

  const handleSaveNewSupplier = async () => {
    if (!newSupplierForm.name.trim()) return
    setSavingSupplier(true)
    try {
      const created = await apiFetch('/suppliers/', {
        method: 'POST',
        body: JSON.stringify({
          name: newSupplierForm.name.trim(),
          company: newSupplierForm.company.trim() || null,
          email: null, phone: null, address: null,
        }),
      })
      const updated = await apiFetch('/suppliers/')
      setSuppliers(updated)
      setForm({ ...form, supplier_id: String(created.supplier_id) })
      setAddingSupplier(false)
      setNewSupplierForm({ name: '', company: '' })
    } catch (err) {
      alert(err.message)
    } finally {
      setSavingSupplier(false)
    }
  }

  const handleCancelNewSupplier = () => {
    setAddingSupplier(false)
    setNewSupplierForm({ name: '', company: '' })
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
    const matchCat = !filterCat || p.category_id === parseInt(filterCat)
    const matchSup = !filterSup || p.supplier_id === parseInt(filterSup)
    return matchSearch && matchCat && matchSup
  })

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: '', description: '', price: '', cost_price: '',
      quantity: '', low_stock_threshold: '5', category_id: '', supplier_id: ''
    })
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      cost_price: p.cost_price ? String(p.cost_price) : '',
      quantity: String(p.quantity),
      low_stock_threshold: String(p.low_stock_threshold),
      category_id: p.category_id ? String(p.category_id) : '',
      supplier_id: p.supplier_id ? String(p.supplier_id) : '',
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const body = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      cost_price: form.cost_price ? parseFloat(form.cost_price) : null,
      quantity: parseInt(form.quantity) || 0,
      low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
      category_id: form.category_id ? parseInt(form.category_id) : null,
      supplier_id: form.supplier_id ? parseInt(form.supplier_id) : null,
    }

    try {
      if (editing) {
        await apiFetch(`/products/${editing.product_id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        })
      } else {
        await apiFetch('/products/', {
          method: 'POST',
          body: JSON.stringify(body),
        })
      }
      setModalOpen(false)
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      await apiFetch(`/products/${id}`, { method: 'DELETE' })
      loadData()
    } catch (err) {
      alert(err.message)
    }
  }

  const getStockBadge = (p) => {
    if (p.quantity === 0) return <span className="badge badge-danger">Out of Stock</span>
    if (p.quantity <= p.low_stock_threshold) return <span className="badge badge-warning">Low Stock</span>
    return <span className="badge badge-success">In Stock</span>
  }

  const getCategoryName = (id) => categories.find(c => c.category_id === id)?.name || '-'
  const getSupplierName = (id) => suppliers.find(s => s.supplier_id === id)?.name || '-'

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <h1>Products</h1>
        <div className="page-header-actions">
          <button id="add-product-btn" className="btn btn-primary" onClick={openCreate}>
            <LuPlus size={18} /> Add Product
          </button>
        </div>
      </div>

      <div className="table-container">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search">
              <LuSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="form-select" style={{ width: 'auto' }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
            </select>
            <select className="form-select" style={{ width: 'auto' }} value={filterSup} onChange={e => setFilterSup(e.target.value)}>
              <option value="">All Suppliers</option>
              {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
            </select>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
            {filteredProducts.length} products
          </span>
        </div>

        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Cost</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Barcode</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><div className="empty-icon"><LuPackage /></div><p>No products found</p></div></td></tr>
            ) : (
              filteredProducts.map(p => (
                <tr key={p.product_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-input)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)', fontSize: '1rem'
                      }}>
                        <LuPackage />
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                        {p.description && <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{p.description.substring(0, 40)}{p.description.length > 40 ? '...' : ''}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{getCategoryName(p.category_id)}</td>
                  <td style={{ fontWeight: 600 }}>Rs.{p.price.toLocaleString()}</td>
                  <td>{p.cost_price ? `Rs.${p.cost_price.toLocaleString()}` : '-'}</td>
                  <td style={{ fontWeight: 600 }}>{p.quantity}</td>
                  <td>{getStockBadge(p)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: 'var(--font-xs)' }}>{p.barcode || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => openEdit(p)}>
                        <LuPencil size={15} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Delete" onClick={() => handleDelete(p.product_id)} style={{ color: 'var(--danger)' }}>
                        <LuTrash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add Product'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {editing ? 'Update' : 'Create'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" />
          </div>
          <div className="form-group">
            <label className="form-label">Selling Price *</label>
            <input className="form-input" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Product description" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Cost Price</label>
            <input className="form-input" type="number" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} placeholder="0.00" />
          </div>
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input className="form-input" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Low Stock Threshold</label>
            <input className="form-input" type="number" value={form.low_stock_threshold} onChange={e => setForm({ ...form, low_stock_threshold: e.target.value })} placeholder="5" />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="form-select"
              value={addingCategory ? '__add_new__' : form.category_id}
              onChange={handleCategoryChange}
            >
              <option value="">Select category</option>
              {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.name}</option>)}
              <option value="__add_new__">＋ Add New Category...</option>
            </select>
            {addingCategory && (
              <div style={{
                display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)',
                alignItems: 'center'
              }}>
                <input
                  ref={newCatInputRef}
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="New category name"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveNewCategory()
                    if (e.key === 'Escape') handleCancelNewCategory()
                  }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveNewCategory}
                  disabled={savingCategory || !newCategoryName.trim()}
                  title="Save category"
                >
                  {savingCategory ? '...' : <LuCheck size={14} />}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCancelNewCategory}
                  title="Cancel"
                >
                  <LuX size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Supplier</label>
          <select
            className="form-select"
            value={addingSupplier ? '__add_new_sup__' : form.supplier_id}
            onChange={handleSupplierChange}
          >
            <option value="">Select supplier</option>
            {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}{s.company ? ` — ${s.company}` : ''}</option>)}
            <option value="__add_new_sup__">＋ Add New Supplier...</option>
          </select>
          {addingSupplier && (
            <div style={{ marginTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                <input
                  ref={newSupInputRef}
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Supplier name *"
                  value={newSupplierForm.name}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, name: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Escape') handleCancelNewSupplier() }}
                />
                <input
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Company (optional)"
                  value={newSupplierForm.company}
                  onChange={e => setNewSupplierForm({ ...newSupplierForm, company: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveNewSupplier()
                    if (e.key === 'Escape') handleCancelNewSupplier()
                  }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveNewSupplier}
                  disabled={savingSupplier || !newSupplierForm.name.trim()}
                  title="Save supplier"
                >
                  {savingSupplier ? '...' : <LuCheck size={14} />}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCancelNewSupplier}
                  title="Cancel"
                >
                  <LuX size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
