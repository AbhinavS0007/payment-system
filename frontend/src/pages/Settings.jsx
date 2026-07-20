import { useEffect, useState } from 'react';
import { api, money } from '../api';

export default function Settings() {
  const [threshold, setThreshold] = useState('');
  const [ok, setOk] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/settings').then((s) => setThreshold(s.directorThreshold)).catch((e) => setError(e.message));
  }, []);

  const save = async () => {
    setError(''); setOk('');
    try {
      const s = await api.put('/api/settings', { directorThreshold: Number(threshold) });
      setThreshold(s.directorThreshold);
      setOk(`Saved. Requests above ${money(s.directorThreshold)} now need Director approval.`);
    } catch (e) { setError(e.message); }
  };

  return (
    <>
      <div className="page-head"><h1>Settings</h1></div>
      <div className="card">
        <h2>Director approval threshold</h2>
        <p style={{ margin: '8px 0 14px', color: '#555' }}>
          Requests above this amount need your approval in addition to Finance.
        </p>
        {error && <div className="error">{error}</div>}
        {ok && <div className="success">{ok}</div>}
        <div className="field" style={{ maxWidth: 260 }}>
          <label>Threshold (₹)</label>
          <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
        </div>
        <div className="btn-row"><button className="btn gold" onClick={save}>Save</button></div>
      </div>
    </>
  );
}
