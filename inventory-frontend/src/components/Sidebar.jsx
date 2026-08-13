import { NavLink, useNavigate } from 'react-router-dom'
import { clearAuth, getUser } from '../api/api'
import {
  LuLayoutDashboard, LuPackage, LuTags, LuTruck, LuUsers,
  LuShoppingCart, LuClipboardList, LuBarChart3, LuBrain,
  LuActivity, LuLogOut, LuBoxes
} from 'react-icons/lu'

export default function Sidebar() {
  const navigate = useNavigate()
  const user = getUser()

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', icon: <LuLayoutDashboard />, path: '/' },
    { section: 'MANAGEMENT' },
    { label: 'Products', icon: <LuPackage />, path: '/products' },
    { label: 'Categories', icon: <LuTags />, path: '/categories' },
    { label: 'Suppliers', icon: <LuTruck />, path: '/suppliers' },
    { label: 'Customers', icon: <LuUsers />, path: '/customers' },
    { section: 'TRANSACTIONS' },
    { label: 'Sales', icon: <LuShoppingCart />, path: '/sales' },
    { label: 'Purchases', icon: <LuClipboardList />, path: '/purchases' },
    { section: 'ANALYTICS' },
    { label: 'Reports', icon: <LuBarChart3 />, path: '/reports' },
    { label: 'AI Insights', icon: <LuBrain />, path: '/ai-insights' },
  ]

  if (user?.role === 'admin') {
    navItems.push(
      { section: 'ADMIN' },
      { label: 'Activity Log', icon: <LuActivity />, path: '/activity-log' }
    )
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon"><LuBoxes /></div>
        <span className="logo-text">Inventory Pro</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, i) => {
          if (item.section) {
            return <div key={i} className="sidebar-section-label">{item.section}</div>
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="icon">{item.icon}</span>
              <span className="label">{item.label}</span>
            </NavLink>
          )
        })}

        <div style={{ flex: 1 }} />

        <button className="sidebar-link" onClick={handleLogout} style={{ marginTop: 'auto' }}>
          <span className="icon"><LuLogOut /></span>
          <span className="label">Logout</span>
        </button>
      </nav>
    </aside>
  )
}
