import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api';
import ImageUpload from '../components/ImageUpload';

export default function PublicSubmit() {
  const { token } = useParams();
  const [state, setState] = useState('loading'); // loading | invalid | form | done
  const [message, setMessage] = useState('');
  const [generatedBy, setGeneratedBy] = useState('');
  const [categories, setCategories] = useState([]);
  const [projects, setProjects] = useState([]);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    submittedByName: '', submittedByContact: '',
    payeeName: '', payeeDetails: '', payeeQrUrl: '', amount: '', category: '',
    project: '', urgency: 'Normal', description: '', attachmentUrl: '', billPhotoUrl: ''
  });

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setVal = (k) => (v) => setF({ ...f, [k]: v });

  useEffect(() => {
    api.get(`/api/public/request-form/${token}`)
      .then((d) => {
        setGeneratedBy(d.generatedByName);
        setCategories(d.categories || []);
        setProjects(d.projects || []);
        setState('form');
      })
      .catch((e) => { setMessage(e.message); setState('invalid'); });
  }, [token]);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const r = await api.post(`/api/public/request-form/${token}`, { ...f, amount: Number(f.amount) });
      setCode(r.code);
      setState('done');
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const Shell = ({ children }) => (
    <div className="login-wrap">
      <div className="login-card" style={{ maxWidth: 620 }}>
        <div className="brand">Blue <span>Isle</span></div>
        <div className="tagline">Payment Request</div>
        {children}
      </div>
    </div>
  );

  if (state === 'loading') return <Shell><div className="empty">Loading…</div></Shell>;

  if (state === 'invalid') return (
    <Shell>
      <div className="empty">
        <h2>Link unavailable</h2>
        <p>{message}</p>
      </div>
    </Shell>
  );

  if (state === 'done') return (
    <Shell>
      <div className="success" style={{ marginTop: 8 }}>
        <h2 style={{ margin: '0 0 6px' }}>Request submitted ✓</h2>
        Your payment request <b>{code}</b> has been sent to the Blue Isle team for approval.
        You can close this page now.
      </div>
    </Shell>
  );

  return (
    <Shell>
      <p style={{ margin: '0 0 14px', color: '#555' }}>
        You’re raising a payment request on behalf of <b>{generatedBy}</b>. This link works once.
      </p>
      {error && <div className="error">{error}</div>}
      <div className="form-grid">
        <div className="field">
          <label>Your name *</label>
          <input value={f.submittedByName} onChange={set('submittedByName')} placeholder="Who is filling this in?" />
        </div>
        <div className="field">
          <label>Your phone / email</label>
          <input value={f.submittedByContact} onChange={set('submittedByContact')} placeholder="So the team can reach you" />
        </div>
        <div className="field">
          <label>Payee name *</label>
          <input value={f.payeeName} onChange={set('payeeName')} placeholder="e.g. Sharma Hardware" />
        </div>
        <div className="field">
          <label>Payee UPI / bank details</label>
          <input value={f.payeeDetails} onChange={set('payeeDetails')} placeholder="UPI ID or A/c + IFSC" />
        </div>
        <ImageUpload
          label="Payee UPI QR (photo)"
          value={f.payeeQrUrl}
          onChange={setVal('payeeQrUrl')}
          hint="Upload/scan the payee's QR so the team can pay by scanning."
        />
        <div className="field">
          <label>Amount (₹) *</label>
          <input type="number" min="1" value={f.amount} onChange={set('amount')} placeholder="12500" />
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
        <div className="field">
          <label>Invoice / quotation link</label>
          <input value={f.attachmentUrl} onChange={set('attachmentUrl')}
            placeholder="Paste a Drive / photo link of the bill" />
        </div>
        <ImageUpload
          label="Or upload a photo of the bill"
          value={f.billPhotoUrl}
          onChange={setVal('billPhotoUrl')}
        />
      </div>
      <div className="btn-row">
        <button className="btn gold" style={{ width: '100%' }} onClick={submit} disabled={busy}>
          {busy ? 'Submitting…' : 'Submit payment request'}
        </button>
      </div>
    </Shell>
  );
}
