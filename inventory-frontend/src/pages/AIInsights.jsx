import { useState, useEffect } from 'react'
import { apiFetch } from '../api/api'
import { LuBrain, LuTrendingUp, LuTrendingDown, LuPackageCheck, LuBarChart3 } from 'react-icons/lu'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AIInsights() {
  const [fastMoving, setFastMoving] = useState([])
  const [slowMoving, setSlowMoving] = useState([])
  const [restock, setRestock] = useState([])
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [predicting, setPredicting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [fm, sm, rs, prods] = await Promise.all([
        apiFetch('/ai/fast-moving'),
        apiFetch('/ai/slow-moving'),
        apiFetch('/ai/restock-recommendations'),
        apiFetch('/products/'),
      ])
      setFastMoving(fm)
      setSlowMoving(sm)
      setRestock(rs)
      setProducts(prods)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handlePredict = async () => {
    if (!selectedProduct) return
    setPredicting(true)
    setPrediction(null)
    try {
      const data = await apiFetch(`/ai/predict/${selectedProduct}`)
      setPrediction(data)
    } catch (err) {
      alert(err.message)
    } finally {
      setPredicting(false)
    }
  }

  if (loading) return <div className="loading-container"><div className="spinner" /></div>

  return (
    <>
      <div className="page-header">
        <h1>AI Insights</h1>
      </div>

      {/* Fast / Slow Movers */}
      <div className="ai-grid">
        <div className="ai-card">
          <h3><LuTrendingUp style={{ color: 'var(--success)' }} /> Fast Moving Products</h3>
          {fastMoving.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>No data available</p>
          ) : (
            fastMoving.map((p, i) => (
              <div key={i} className="ai-product-row">
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>
                    {p.name || p.product_name}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    {p.total_sold || p.total_quantity} units sold
                  </div>
                </div>
                <span className="badge badge-success">#{i + 1}</span>
              </div>
            ))
          )}
        </div>

        <div className="ai-card">
          <h3><LuTrendingDown style={{ color: 'var(--danger)' }} /> Slow Moving Products</h3>
          {slowMoving.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>No data available</p>
          ) : (
            slowMoving.map((p, i) => (
              <div key={i} className="ai-product-row">
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--font-sm)' }}>
                    {p.name || p.product_name}
                  </div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                    {p.total_sold || p.total_quantity} units sold
                  </div>
                </div>
                <span className="badge badge-danger">#{i + 1}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Restock Recommendations */}
      <div className="ai-card" style={{ marginBottom: 'var(--space-8)' }}>
        <h3><LuPackageCheck style={{ color: 'var(--warning)' }} /> Restock Recommendations</h3>
        {restock.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>No restock recommendations at this time</p>
        ) : (
          restock.map((r, i) => (
            <div key={i} className="restock-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.name || r.product_name}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Current Stock: {r.current_stock ?? r.quantity} | Recommended Order: {r.recommended_order ?? r.restock_quantity ?? 'N/A'}
                  </div>
                </div>
                <span className={`badge ${(r.current_stock ?? r.quantity) === 0 ? 'badge-danger' : 'badge-warning'}`}>
                  {(r.current_stock ?? r.quantity) === 0 ? 'Urgent' : 'Recommended'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sales Prediction */}
      <div className="ai-card">
        <h3><LuBarChart3 style={{ color: 'var(--accent-primary)' }} /> Sales Prediction</h3>
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label className="form-label">Select Product</label>
            <select className="form-select" value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)}>
              <option value="">Choose a product...</option>
              {products.map(p => (
                <option key={p.product_id} value={p.product_id}>{p.name}</option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" onClick={handlePredict} disabled={!selectedProduct || predicting}>
            <LuBrain size={16} /> {predicting ? 'Predicting...' : 'Predict'}
          </button>
        </div>

        {prediction && (
          <div style={{ marginTop: 'var(--space-4)' }}>
            <div style={{
              background: 'var(--bg-input)', borderRadius: 'var(--radius-md)',
              padding: 'var(--space-4)', marginBottom: 'var(--space-4)'
            }}>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                {prediction.product_name || 'Product'}
              </div>
              <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 700, color: 'var(--accent-primary)' }}>
                {prediction.predicted_sales ?? prediction.prediction ?? 'N/A'} units
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
                Predicted sales for next month
              </div>
              {prediction.confidence && (
                <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Confidence: {typeof prediction.confidence === 'number' ? `${(prediction.confidence * 100).toFixed(1)}%` : prediction.confidence}
                </div>
              )}
            </div>

            {prediction.historical_data && prediction.historical_data.length > 0 && (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={prediction.historical_data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px', color: '#f1f5f9'
                    }}
                  />
                  <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </>
  )
}
