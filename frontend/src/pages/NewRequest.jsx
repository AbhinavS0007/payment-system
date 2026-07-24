import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import ImageUpload from '../components/ImageUpload';

export default function NewRequest() {
  const nav = useNavigate();
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [f, setF] = useState({
    payeeName: '', payeeDetails: '', payeeQrUrl: '', amount: '', category: '',
    project: '', urgency: 'Normal', description: '', attachmentUrl: '', billPhotoUrl: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/api/categories'), api.get('/api/projects')])
      .then(([c, p]) => { setCategories(c.map((x) => x.name)); setProjects(p.map((x) => x.name)); })
      .catch((e) => setError(e.message));
  }, []);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setVal = (k) => (v) => setF({ ...f, [k]: v });

  const save = async (submit) => {
    setError('');
    setBusy(true);
    try {
      const r = await api.post('/api/requests', { ...f, amount: Number(f.amount), submit });
      nav(`/requests/${r._id}`);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-head"><h1>New Payment Request</h1></div>
      <div className="card">
        {error && <div className="error">{error}</div>}
        <div className="form-grid">
          <div className="field">
            <label>Payee name *</label>
            <input value={f.payeeName} onChange={set('payeeName')} placeholder="e.g. Sharma Hardware" />
          </div>
          <div className="field">
            <label>Amount (₹) *</label>
            <input type="number" min="1" value={f.amount} onChange={set('amount')} placeholder="12500" />
          </div>
          <div className="field full">
            <label>Payee UPI / bank details</label>
            <input value={f.payeeDetails} onChange={set('payeeDetails')} placeholder="UPI ID or A/c + IFSC" />
            <ImageUpload
              caption="…or add the payee's UPI QR — take a photo or upload one, so operations can pay by scanning it."
              value={f.payeeQrUrl}
              onChange={setVal('payeeQrUrl')}
            />
          </div>
          <div className="field">
            <label>Category *</label>
            <select value={f.category} onChange={set('category')}>
              <option value="">Select a category…</option>
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Project / site *</label>
            <select value={f.project} onChange={set('project')}>
              <option value="">Select a project…</option>
              {projects.map((p) => <option key={p}>{p}</option>)}
            </select>
            {projects.length === 0 && <p className="hint">No projects yet — an operations/admin user needs to add one under Manage Lists.</p>}
          </div>
          <div className="field">
            <label>Urgency</label>
            <select value={f.urgency} onChange={set('urgency')}>
              <option>Normal</option><option>Urgent</option>
            </select>
          </div>
          <div className="field full">
            <label>What is this payment for?</label>
            <textarea rows="3" value={f.description} onChange={set('description')}
              placeholder="Brief note — e.g. 2nd instalment for modular kitchen carcass material" />
          </div>
          <div className="field full">
            <label>Invoice / quotation</label>
            <input value={f.attachmentUrl} onChange={set('attachmentUrl')}
              placeholder="Paste a Drive / photo link of the bill" />
            <ImageUpload
              caption="…or upload / photograph the bill directly."
              value={f.billPhotoUrl}
              onChange={setVal('billPhotoUrl')}
            />
          </div>
        </div>
        <div className="btn-row">
          <button className="btn gold" onClick={() => save(true)} disabled={busy}>Submit for approval</button>
          <button className="btn ghost" onClick={() => save(false)} disabled={busy}>Save as draft</button>
        </div>
      </div>
    </>
  );
}
