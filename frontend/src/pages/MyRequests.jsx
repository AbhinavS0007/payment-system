import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, money } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const CATEGORIES = ['Site Material', 'Labour', 'Subcontractor', 'Office', 'Marketing', 'Travel', 'Misc'];
const STATUSES = ['draft', 'submitted', 'finance_approved', 'operations_approved', 'approved', 'sent_back', 'rejected', 'paid', 'closed'];

export default function MyRequests() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [project, setProject] = useState('');
  const isApprover = ['finance', 'operations', 'admin'].includes(user.role);

  const load = () => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (category) q.set('category', category);
    if (project) q.set('project', project);
    setError('');
    api.get(`/api/requests?${q}`).then(setRows).catch((e) => { setError(e.message); setRows([]); });
  };

  useEffect(() => { load(); }, [status, category, project]);

  return (
    <>
      <div className="page-head">
        <h1>{isApprover ? 'All Requests' : 'My Requests'}</h1>
        <Link to="/requests/new" className="btn gold">+ New Request</Link>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input placeholder="Filter by project…" value={project} onChange={(e) => setProject(e.target.value)} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {rows === null ? (
          <div className="empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <h2>{error ? 'Could not load requests' : 'No requests yet'}</h2>
            <p>{error ? 'Fix the connection above and refresh.' : 'Raise your first payment request to get started.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Code</th><th>Payee</th><th>Amount</th><th>Category</th>
                <th>Project</th>{isApprover && <th>Requester</th>}<th>Status</th><th>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="clickable" onClick={() => nav(`/requests/${r._id}`)}>
                  <td><b>{r.code}</b>{r.urgency === 'Urgent' && <> <span className="badge urgent">Urgent</span></>}</td>
                  <td>{r.payeeName}</td>
                  <td><b>{money(r.amount)}</b></td>
                  <td>{r.category}</td>
                  <td>{r.project}</td>
                  {isApprover && <td>{r.requester?.name}</td>}
                  <td><StatusBadge status={r.status} /></td>
                  <td>{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
