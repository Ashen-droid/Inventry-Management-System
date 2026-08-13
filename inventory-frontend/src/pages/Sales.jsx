import { useState, useEffect } from 'react'
import { apiFetch } from '../api/api'
import { LuShoppingCart, LuSearch, LuPlus, LuMinus, LuTrash2, LuDownload, LuCheck } from 'react-icons/lu'

export default function Sales() {
  const [products, setProducts] = useState([])
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [customerId, setCustomerId] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lastSale, setLastSale] = useState(null)

  // Load sales history
  const [sales, setSales] = useState([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [p, c, s] = await Promise.all([
        apiFetch('/products/'),
        apiFetch('/customers/'),
        apiFetch('/sales/'),
      ])
      setProducts(p.filter(pr => pr.quantity > 0))
      setCustomers(c)
      setSales(s)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const filteredProducts = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase()))
  )

  const addToCart = (product) => {
    const existing = cart.find(i => i.product_id === product.product_id)
    if (existing) {
      if (existing.quantity >= product.quantity) return
      setCart(cart.map(i =>
        i.product_id === product.product_id
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ))
    } else {
      setCart([...cart, {
        product_id: product.product_id,
        name: product.name,
        price: product.price,
        max_qty: product.quantity,
        quantity: 1,
      }])
    }
  }

  const updateCartQty = (productId, delta) => {
    setCart(cart.map(i => {
      if (i.product_id !== productId) return i
      const newQty = i.quantity + delta
      if (newQty < 1 || newQty > i.max_qty) return i
      return { ...i, quantity: newQty }
    }))
  }

  const removeFromCart = (productId) => {
    setCart(cart.filter(i => i.product_id !== productId))
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const handleSubmitSale = async () => {
    if (cart.length === 0) return
    setSubmitting(true)
    try {
      const body = {
        customer_id: customerId ? parseInt(customerId) : null,
        notes: notes || null,
        items: cart.map(i => ({ product_id: i.product_id, quantity: i.quantity })),
      }
      const sale = await apiFetch('/sales/', { method: 'POST', body: JSON.stringify(body) })
      setLastSale(sale)
      setCart([])
      setCustomerId('')
      setNotes('')
      loadData()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const downloadInvoice = async (saleId) => {
    try {
      const blob = await apiFetch(`/sales/${saleId}/invoice`)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice_${saleId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <h1>Sales (POS)</h1>
        <div className="page-header-actions">
          <button
            className={`btn ${showHistory ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'New Sale' : 'Sales History'}
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {lastSale && (
        <div style={{
          background: 'var(--success-bg)', border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 'var(--radius-md)', padding: 'var(--space-4)',
          marginBottom: 'var(--space-6)', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--success)' }}>
            <LuCheck size={18} />
            <span>Sale #{lastSale.sale_id} completed! Invoice: {lastSale.invoice_number} — Rs.{lastSale.total_amount.toLocaleString()}</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => downloadInvoice(lastSale.sale_id)}>
            <LuDownload size={14} /> Download Invoice
          </button>
        </div>
      )}

      {showHistory ? (
        /* Sales History */
        <div className="table-container">
          <div className="table-toolbar">
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600 }}>Sales History</h3>
          </div>
          <table>
            <thead>
              <tr><th>Invoice</th><th>Date</th><th>Items</th><th>Total</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No sales yet</td></tr>
              ) : (
                sales.map(s => (
                  <tr key={s.sale_id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.invoice_number}</td>
                    <td>{new Date(s.sale_date).toLocaleDateString()} {new Date(s.sale_date).toLocaleTimeString()}</td>
                    <td>{s.items.length}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>Rs.{s.total_amount.toLocaleString()}</td>
                    <td>
                      {s.invoice_pdf && (
                        <button className="btn btn-ghost btn-sm" onClick={() => downloadInvoice(s.sale_id)}>
                          <LuDownload size={14} /> PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* POS Layout */
        <div className="pos-layout">
          {/* Products */}
          <div className="pos-products">
            <div className="table-toolbar">
              <div className="table-search">
                <LuSearch className="search-icon" />
                <input type="text" placeholder="Search products or scan barcode..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>
            <table>
              <thead>
                <tr><th>Product</th><th>Price</th><th>Stock</th><th></th></tr>
              </thead>
              <tbody>
                {filteredProducts.map(p => (
                  <tr key={p.product_id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</td>
                    <td>Rs.{p.price.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${p.quantity <= p.low_stock_threshold ? 'badge-warning' : 'badge-success'}`}>
                        {p.quantity}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-primary btn-sm" onClick={() => addToCart(p)}>
                        <LuPlus size={14} /> Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Cart */}
          <div className="pos-cart">
            <h3><LuShoppingCart /> Cart ({cart.length})</h3>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <LuShoppingCart size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                <p>Cart is empty</p>
                <p style={{ fontSize: 'var(--font-xs)' }}>Add products to start a sale</p>
              </div>
            ) : (
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.product_id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-price">Rs.{item.price.toLocaleString()} × {item.quantity} = Rs.{(item.price * item.quantity).toLocaleString()}</div>
                    </div>
                    <div className="cart-qty">
                      <button onClick={() => updateCartQty(item.product_id, -1)}><LuMinus size={12} /></button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateCartQty(item.product_id, 1)}><LuPlus size={12} /></button>
                    </div>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => removeFromCart(item.product_id)} style={{ color: 'var(--danger)' }}>
                      <LuTrash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
              <label className="form-label">Customer (optional)</label>
              <select className="form-select" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                <option value="">Walk-in Customer</option>
                {customers.map(c => <option key={c.customer_id} value={c.customer_id}>{c.name}</option>)}
              </select>
            </div>

            <div className="cart-total">
              <span className="cart-total-label">Total</span>
              <span className="cart-total-value">Rs.{cartTotal.toLocaleString()}</span>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%', height: '48px', fontSize: 'var(--font-md)' }}
              onClick={handleSubmitSale}
              disabled={cart.length === 0 || submitting}
            >
              {submitting ? 'Processing...' : `Complete Sale — Rs.${cartTotal.toLocaleString()}`}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
