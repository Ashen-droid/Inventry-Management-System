import { getUser } from '../api/api'
import { LuSearch, LuBell } from 'react-icons/lu'

export default function Topbar() {
  const user = getUser()
  const initials = user?.full_name
    ? user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
    : user?.username?.[0]?.toUpperCase() || 'U'

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-search">
          <LuSearch className="search-icon" />
          <input type="text" placeholder="Search anything..." />
        </div>
      </div>

      <div className="topbar-right">
        <button className="btn btn-ghost btn-icon">
          <LuBell size={18} />
        </button>

        <div className="topbar-user">
          <div className="topbar-avatar">{initials}</div>
          <div className="topbar-user-info">
            <span className="topbar-user-name">{user?.full_name || user?.username || 'User'}</span>
            <span className="topbar-user-role">{user?.role || 'employee'}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
