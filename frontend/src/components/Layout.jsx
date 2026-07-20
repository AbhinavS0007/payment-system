import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const isApprover = ['finance', 'director'].includes(user.role);
  const roleLabel = { employee: 'Team Member', finance: 'Finance', director: 'Director' }[user.role];

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Blue <span>Isle</span></div>
        <div className="tagline">Payments</div>
        <nav>
          {isApprover && <NavLink to="/dashboard">Dashboard</NavLink>}
          <NavLink to="/requests" end>{isApprover ? 'All Requests' : 'My Requests'}</NavLink>
          <NavLink to="/requests/new">New Request</NavLink>
          {isApprover && <NavLink to="/approvals">Approvals</NavLink>}
          {user.role === 'director' && <NavLink to="/users">Team</NavLink>}
          {user.role === 'director' && <NavLink to="/settings">Settings</NavLink>}
        </nav>
        <div className="who"><b>{user.name}</b>{roleLabel}</div>
        <button className="logout" onClick={logout}>Log out</button>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
