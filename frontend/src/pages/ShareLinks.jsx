import { useEffect, useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';

const linkUrl = (token) => `${window.location.origin}/submit/${token}`;

const EXPIRY_OPTIONS = [
  { label: '1 hour', hours: 1 },
  { label: '6 hours', hours: 6 },
  { label: '24 hours', hours: 24 },
  { label: '48 hours', hours: 48 }
];

export default function ShareLinks() {
  const { user } = useAuth();
  const [links, setLinks] = useState(null);
  const [hours, setHours] = useState(48);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState('');

  const load = () => api.get('/api/request-links').then(setLinks).catch((e) => { setError(e.message); setLinks([]); });
  useEffect(() => { load(); }, []);

  const generate = async () => {
    setError(''); setOk(''); setBusy(true);
    try {
      const link = await api.post('/api/request-links', { expiresInHours: hours });
      await navigator.clipboard?.writeText(linkUrl(link.token)).catch(() => {});
      setOk('Link generated and copied to clipboard. Send it to whoever should fill the form.');
      load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const copy = async (token) => {
    await navigator.clipboard?.writeText(linkUrl(token)).catch(() => {});
    setCopied(token);
    setTimeout(() => setCopied(''), 1500);
  };

  const expireAll = async (global) => {
    const msg = global
      ? 'Expire EVERYONE\'s active links across the company? Anyone holding one will need a new link.'
      : 'Expire all your active links? Anyone holding one will need a new link.';
    if (!window.confirm(msg)) return;
    setError(''); setOk('');
    try {
      const r = await api.post('/api/request-links/expire-all', { global });
      setOk(`${r.expired} link(s) expired.`);
      load();
    } catch (e) { setError(e.message); }
  };

  const statusOf = (l) => l.used ? 'Used' : l.active ? 'Active' : 'Expired';

  return (
    <>
      <div className="page-head"><h1>Share a Request Link</h1></div>

      <div className="card">
        <h2>Generate a one-time link</h2>
        <p style={{ margin: '8px 0 14px', color: '#555' }}>
          Send this link to anyone — a site person, vendor, or colleague without an account.
          They can fill in <b>one</b> payment request on your behalf, and it enters the normal approval flow.
        </p>
        {error && <div className="error">{error}</div>}
        {ok && <div className="success">{ok}</div>}
        <div className="field" style={{ maxWidth: 220 }}>
          <label>Link valid for</label>
          <select value={hours} onChange={(e) => setHours(Number(e.target.value))}>
            {EXPIRY_OPTIONS.map((o) => <option key={o.hours} value={o.hours}>{o.label}</option>)}
          </select>
        </div>
        <div className="btn-row">
          <button className="btn gold" onClick={generate} disabled={busy}>
            {busy ? 'Generating…' : 'Generate & copy link'}
          </button>
          <button className="btn ghost" onClick={() => expireAll(false)}>Expire all my links</button>
          {user.role === 'admin' && (
            <button className="btn danger" onClick={() => expireAll(true)}>Expire everyone’s links</button>
          )}
        </div>
        <p style={{ marginTop: 10, fontSize: 13, color: '#8b5e3c' }}>
          Links can be valid for up to 48 hours and can only be used once.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        {links === null ? (
          <div className="empty">Loading…</div>
        ) : links.length === 0 ? (
          <div className="empty"><h2>No links yet</h2><p>Generate one above to get started.</p></div>
        ) : (
          <table>
            <thead><tr><th>Status</th><th>Created</th><th>Expires</th><th>Used by</th><th></th></tr></thead>
            <tbody>
              {links.map((l) => (
                <tr key={l._id}>
                  <td>
                    <span className={`badge ${l.used ? 'closed' : l.active ? 'approved' : 'rejected'}`}>
                      {statusOf(l)}
                    </span>
                  </td>
                  <td>{new Date(l.createdAt).toLocaleString('en-IN')}</td>
                  <td>{new Date(l.expiresAt).toLocaleString('en-IN')}</td>
                  <td>{l.request ? 'Submitted' : '—'}</td>
                  <td>
                    {l.active && (
                      <button className="btn ghost" onClick={() => copy(l.token)}>
                        {copied === l.token ? 'Copied ✓' : 'Copy link'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
