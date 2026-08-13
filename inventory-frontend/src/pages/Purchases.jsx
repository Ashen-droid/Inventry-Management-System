import { useState, useEffect } from 'react'
import { apiFetch } from '../api/api'
import { LuPlus, LuTrash2, LuClipboardList, LuCheck } from 'react-icons/lu'

export default function Purchases() {
  const [products, setProducts] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  // Form
  const [supplierId, setSupplierId] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState([{ product_id: '', quantity: '', cost_price: '' }])
  const [submitting, setSubmitting] = useState(false)
  const [lastPurchase, setLastPurchase] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [p, s, pu] = await Promise.all([
        apiFetch('/products/'),
        apiFetch('/suppliers/'),
        apiFetch('/purchases/'),
      ])
      setProducts(p)
      setSuppliers(s)
      setPurchases(pu)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const addItemRow = () => {
    setItems([...items, { product_id: '', quantity: '', cost_price: '' }])
  }

  const removeItemRow = (index) => {
    if (items.length === 1) return
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index, field, value) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  const totalCost = items.reduce((sum, i) => {
    const qty = parseInt(i.quantity) || 0
    const cost = parseFloat(i.cost_price) || 0
    return sum + qty * cost
  }, 0)

  const handleSubmit = async () => {
    if (!supplierId) return alert('Please select a supplier')
    const validItems = items.filter(i => i.product_id && i.quantity && i.cost_price)
    if (validItems.length === 0) return alert('Please add at least one item')

    setSubmitting(true)
    try {
      const body = {
        supplier_id: parseInt(supplierId),
        notes: notes || null,
        items: validItems.map(i => ({
          product_id: parseInt(i.product_id),
          quantity: parseInt(i.quantity),
          cost_price: parseFloat(i.cost_price),
        })),
      }
      const purchase = await apiFetch('/purchases/', { method: 'POST', body: JSON.stringify(body) })
      setLastPurchase(purchase)
      setSupplierId('')
      setNotes('')
      setItems([{ product_id: '', quantity: '', cost_price: '' }])
      loadData()
    } catch (err) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <h1>Purchases</h1>
        <button
          className={`btn ${showHistory ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'New Purchase' : 'Purchase History'}
        </button>
      </div>

      {lastPurchase && (
        <div style={{
          background: 'var(--success-bg)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--success)'
        }}>
          <LuCheck size={18} />
          <span>Purchase #{lastPurchase.purchase_id} completed — Rs.{lastPurchase.total_cost.toLocaleString()}. Stock updated!</span>
        </div>
      )}

      {showHistory ? (
        <div className="table-container">
          <div className="table-toolbar">
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600 }}>Purchase History</h3>
          </div>
          <table>
            <thead>
              <tr><th>#</th><th>Date</th><th>Supplier</th><th>Items</th><th>Total Cost</th></tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No purchases yet</td></tr>
              ) : (
                purchases.map(p => (
                  <tr key={p.purchase_id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>#{p.purchase_id}</td>
                    <td>{new Date(p.purchase_date).toLocaleDateString()}</td>
                    <td>{suppliers.find(s => s.supplier_id === p.supplier_id)?.name || '-'}</td>
                    <td>{p.items.length}</td>
                    <td style={{ fontWeight: 600 }}>Rs.{p.total_cost.toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card" style={{ maxWidth: '800px' }}>
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <LuClipboardList /> New Purchase Order
          </h3>

          <div className="form-row" style={{ marginBottom: 'var(--space-5)' }}>
            <div className="form-group">
              <label className="form-label">Supplier *</label>
              <select className="form-select" value={supplierId} onChange={e => setSupplierId(e.target.value)}>
                <option value="">Select supplier</option>
                {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <input className="form-input" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>

          <div style={{ marginBottom: 'var(--space-4)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <label className="form-label">Items</label>
              <button className="btn btn-secondary btn-sm" onClick={addItemRow}><LuPlus size={14} /> Add Item</button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} style={{
                display: 'grid', gridTemplateColumns: '1fr 100px 120px 36px',
                gap: 'var(--space-3)', marginBottom: 'var(--space-3)', alignItems: 'center'
              }}>
                <select className="form-select" value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)}>
                  <option value="">Select product</option>
                  {products.map(p => <option key={p.product_id} value={p.product_id}>{p.name}</option>)}
                </select>
                <input className="form-input" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                <input className="form-input" type="number" placeholder="Cost" value={item.cost_price} onChange={e => updateItem(idx, 'cost_price', e.target.value)} />
                <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeItemRow(idx)} style={{ color: 'var(--danger)' }}>
                  <LuTrash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div style={{
            borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-4)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>Total Cost: </span>
              <span style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--accent-primary)' }}>Rs.{totalCost.toLocaleString()}</span>
            </div>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Processing...' : 'Submit Purchase'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
