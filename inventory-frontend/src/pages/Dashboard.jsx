import { useState, useEffect } from 'react'
import { apiFetch } from '../api/api'
import {
  LuPackage, LuAlertTriangle, LuXCircle, LuDollarSign,
  LuTrendingUp, LuWallet
} from 'react-icons/lu'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#14b8a6', '#f97316']

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [lowStock, setLowStock] = useState([])
  const [monthlySales, setMonthlySales] = useState([])
  const [categorySales, setCategorySales] = useState([])
  const [recentTx, setRecentTx] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [s, ls, ms, cs, rt] = await Promise.all([
        apiFetch('/dashboard/stats'),
        apiFetch('/dashboard/low-stock-products'),
        apiFetch('/dashboard/monthly-sales-chart'),
        apiFetch('/dashboard/category-sales-chart'),
        apiFetch('/dashboard/recent-transactions'),
      ])
      setStats(s)
      setLowStock(ls)
      setMonthlySales(ms)
      setCategorySales(cs)
      setRecentTx(rt)
    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading-container"><div className="spinner" /></div>
  }

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon indigo"><LuPackage /></div>
          <div className="stat-info">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats?.total_products || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><LuAlertTriangle /></div>
          <div className="stat-info">
            <span className="stat-label">Low Stock</span>
            <span className="stat-value">{stats?.low_stock_items || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon rose"><LuXCircle /></div>
          <div className="stat-info">
            <span className="stat-label">Out of Stock</span>
            <span className="stat-value">{stats?.out_of_stock || 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon emerald"><LuDollarSign /></div>
          <div className="stat-info">
            <span className="stat-label">Today Sales</span>
            <span className="stat-value">Rs.{(stats?.today_sales || 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon sky"><LuTrendingUp /></div>
          <div className="stat-info">
            <span className="stat-label">Monthly Revenue</span>
            <span className="stat-value">Rs.{(stats?.monthly_revenue || 0).toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon violet"><LuWallet /></div>
          <div className="stat-info">
            <span className="stat-label">Monthly Profit</span>
            <span className="stat-value">Rs.{(stats?.monthly_profit || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        <div className="chart-card">
          <h3>Monthly Sales Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlySales}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', color: '#f1f5f9'
                }}
              />
              <Bar dataKey="revenue" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Sales by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categorySales}
                dataKey="total"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={50}
                paddingAngle={3}
                label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
              >
                {categorySales.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px', color: '#f1f5f9'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Alerts */}
      {lowStock.length > 0 && (
        <div className="alerts-section">
          <h3><LuAlertTriangle style={{ color: 'var(--warning)' }} /> Low Stock Alerts</h3>
          <div className="alert-cards">
            {lowStock.map(p => (
              <div key={p.product_id} className={`alert-card ${p.status === 'OUT_OF_STOCK' ? 'danger' : 'warning'}`}>
                <span className="alert-icon">
                  {p.status === 'OUT_OF_STOCK' ? <LuXCircle style={{ color: 'var(--danger)' }} /> : <LuAlertTriangle style={{ color: 'var(--warning)' }} />}
                </span>
                <div className="alert-info">
                  <div className="alert-name">{p.name}</div>
                  <div className="alert-qty">
                    Stock: {p.quantity} / Threshold: {p.threshold}
                  </div>
                </div>
                <span className={`badge ${p.status === 'OUT_OF_STOCK' ? 'badge-danger' : 'badge-warning'}`}>
                  {p.status === 'OUT_OF_STOCK' ? 'Out' : 'Low'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="table-container">
        <div className="table-toolbar">
          <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600 }}>Recent Transactions</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentTx.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No transactions yet</td></tr>
            ) : (
              recentTx.map(tx => (
                <tr key={tx.sale_id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{tx.invoice_number}</td>
                  <td>{tx.customer}</td>
                  <td>{tx.items_count}</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>Rs.{tx.total_amount.toLocaleString()}</td>
                  <td>{new Date(tx.sale_date).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
