import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const CATEGORIES = ['Site Material', 'Labour', 'Subcontractor', 'Office', 'Marketing', 'Travel', 'Misc'];

export default function NewRequest() {
  const nav = useNavigate();
  const [f, setF] = useState({
    payeeName: '', payeeDetails: '', amount: '', category: 'Site Material',
    project: '', urgency: 'Normal', description: '', attachmentUrl: ''
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

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
            <label>Payee UPI / bank details</label>
            <input value={f.payeeDetails} onChange={set('payeeDetails')} placeholder="UPI ID or A/c + IFSC" />
          </div>
          <div className="field">
            <label>Amount (₹) *</label>
            <input type="number" min="1" value={f.amount} onChange={set('amount')} placeholder="12500" />
          </div>
          <div className="field">
            <label>Category *</label>
            <select value={f.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Project / site *</label>
            <input value={f.project} onChange={set('project')} placeholder="e.g. Kharghuli Residence" />
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
            <label>Invoice / quotation link</label>
            <input value={f.attachmentUrl} onChange={set('attachmentUrl')}
              placeholder="Paste a Drive / photo link of the bill" />
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
