import { useEffect, useState } from 'react';
import { api, money } from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/dashboard/summary').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">Loading…</div>;

  const count = (s) => data.statusCounts.find((x) => x._id === s)?.count || 0;
  const pending = count('submitted') + count('finance_approved');
  const toPay = count('approved');
  const maxCat = Math.max(...data.byCategory.map((c) => c.total), 1);
  const maxProj = Math.max(...data.byProject.map((p) => p.total), 1);

  const download = async () => {
    const token = localStorage.getItem('bi_token');
    const res = await fetch(api.exportUrl(), { headers: { Authorization: `Bearer ${token}` } });
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'blueisle-payments.csv';
    a.click();
  };

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <button className="btn ghost" onClick={download}>Export CSV</button>
      </div>

      <div className="stats">
        <div className="stat"><div className="num">{money(data.monthSpend.total)}</div><div className="cap">Paid this month</div></div>
        <div className="stat"><div className="num">{pending}</div><div className="cap">Awaiting approval</div></div>
        <div className="stat"><div className="num">{toPay}</div><div className="cap">Approved · to pay</div></div>
        <div className="stat"><div className="num">{count('paid') + count('closed')}</div><div className="cap">Total paid requests</div></div>
      </div>

      <div className="card">
        <h2>Spend by category</h2>
        <div style={{ marginTop: 14 }}>
          {data.byCategory.length === 0 && <p style={{ color: '#8b5e3c' }}>No paid requests yet.</p>}
          {data.byCategory.map((c) => (
            <div className="bar-row" key={c._id}>
              <div className="name">{c._id}</div>
              <div className="track"><div className="fill" style={{ width: `${(c.total / maxCat) * 100}%` }} /></div>
              <div className="val">{money(c.total)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>Spend by project</h2>
        <div style={{ marginTop: 14 }}>
          {data.byProject.length === 0 && <p style={{ color: '#8b5e3c' }}>No paid requests yet.</p>}
          {data.byProject.map((p) => (
            <div className="bar-row" key={p._id}>
              <div className="name">{p._id}</div>
              <div className="track"><div className="fill" style={{ width: `${(p.total / maxProj) * 100}%`, background: '#c9a227' }} /></div>
              <div className="val">{money(p.total)}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
