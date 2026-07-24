import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

export default function Approvals() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/requests')
      .then((all) => {
        const pending = all.filter((r) => {
          if (r.status === 'submitted') return ['finance', 'admin'].includes(user.role);
          if (r.status === 'finance_approved') return ['operations', 'admin'].includes(user.role);
          if (r.status === 'operations_approved') return user.role === 'admin';
          if (r.status === 'approved') return true;
          return false;
        });
        setRows(pending);
      })
      .catch((e) => { setError(e.message); setRows([]); });
  }, []);

  return (
    <>
      <div className="page-head"><h1>Approvals Queue</h1></div>
      {error && <div className="error">{error}</div>}
      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {rows === null ? (
          <div className="empty">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="empty">
            <h2>{error ? 'Could not load requests' : 'All clear'}</h2>
            <p>{error ? 'Fix the connection above and refresh.' : 'Nothing is waiting on you right now.'}</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr><th>Code</th><th>Payee</th><th>Amount</th><th>Project</th><th>Requester</th><th>Waiting on</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="clickable" onClick={() => nav(`/requests/${r._id}`)}>
                  <td><b>{r.code}</b>{r.urgency === 'Urgent' && <> <span className="badge urgent">Urgent</span></>}</td>
                  <td>{r.payeeName}</td>
                  <td><b>{money(r.amount)}</b></td>
                  <td>{r.project}</td>
                  <td>{r.requester?.name}</td>
                  <td><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
