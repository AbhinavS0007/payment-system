import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import MyRequests from './pages/MyRequests';
import NewRequest from './pages/NewRequest';
import RequestDetail from './pages/RequestDetail';
import Approvals from './pages/Approvals';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Settings from './pages/Settings';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="empty"><h2>Loading…</h2></div>;
  if (!user) return <Login />;

  const isApprover = ['finance', 'operations', 'admin'].includes(user.role);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to={isApprover ? '/dashboard' : '/requests'} />} />
        <Route path="/requests" element={<MyRequests />} />
        <Route path="/requests/new" element={<NewRequest />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        {isApprover && <Route path="/approvals" element={<Approvals />} />}
        {isApprover && <Route path="/dashboard" element={<Dashboard />} />}
        {user.role === 'admin' && <Route path="/users" element={<Users />} />}
        {user.role === 'admin' && <Route path="/settings" element={<Settings />} />}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );
}
