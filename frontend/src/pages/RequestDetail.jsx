import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, money } from '../api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Journey from '../components/Journey';

const ACTION_LABELS = {
  created: 'Created', submitted: 'Submitted', edited: 'Edited',
  finance_approved: 'Approved by Finance', operations_approved: 'Approved by Operations', admin_approved: 'Approved by Admin',
  rejected: 'Rejected', sent_back: 'Sent back for changes', paid: 'Payment recorded', closed: 'Closed'
};

export default function RequestDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [pay, setPay] = useState({ mode: 'UPI', reference: '', proofUrl: '' });
  const [busy, setBusy] = useState(false);

  // Note the braces: this must NOT return the promise, or React treats it as a
  // cleanup function on unmount and tears the whole app down.
  const load = () => {
    api.get(`/api/requests/${id}`).then(setData).catch((e) => setError(e.message));
  };
  useEffect(() => { load(); }, [id]);

  if (error && !data) return <div className="error">{error}</div>;
  if (!data) return <div className="empty">Loading…</div>;

  const { request: r } = data;
  const logs = data.logs || [];
  const isApprover = ['finance', 'operations', 'admin'].includes(user.role);
  const isOwner = String(r.requester?._id) === String(user.id);

  const act = async (path, body = {}) => {
    setError('');
    setBusy(true);
    try {
      await api.post(`/api/requests/${id}/${path}`, body);
      setRemarks('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const decide = (stage, decision) => act(stage, { decision, remarks });

  return (
    <>
      <div className="page-head">
        <h1>{r.code}</h1>
        <StatusBadge status={r.status} />
      </div>

      <div className="card">
        <Journey request={r} />
        <div className="meta-grid" style={{ marginTop: 18 }}>
          <div><div className="k">Payee</div><div className="v">{r.payeeName}</div></div>
          <div><div className="k">Amount</div><div className="v">{money(r.amount)}</div></div>
          <div><div className="k">Category</div><div className="v">{r.category}</div></div>
          <div><div className="k">Project</div><div className="v">{r.project}</div></div>
          <div><div className="k">Requested by</div><div className="v">{r.requester?.name}{r.viaLink && ' (shared link)'}</div></div>
          <div><div className="k">Urgency</div><div className="v">{r.urgency}</div></div>
          {r.viaLink && <div><div className="k">Filled by</div><div className="v">{r.submittedByName}{r.submittedByContact && ` · ${r.submittedByContact}`}</div></div>}
          {r.payeeDetails && <div><div className="k">Payee details</div><div className="v">{r.payeeDetails}</div></div>}
          <div><div className="k">Approval level</div><div className="v">{r.needsAdmin ? 'Finance + Operations + Admin' : 'Finance + Operations'}</div></div>
        </div>
        {r.description && <p style={{ marginTop: 14, color: '#555' }}>{r.description}</p>}
        {(r.payeeQrUrl || r.billPhotoUrl) && (
          <div className="attach-row">
            {r.payeeQrUrl && (
              <div className="attach">
                <div className="k">Payee QR — scan to pay</div>
                <a href={r.payeeQrUrl} target="_blank" rel="noreferrer"><img src={r.payeeQrUrl} alt="Payee QR" /></a>
              </div>
            )}
            {r.billPhotoUrl && (
              <div className="attach">
                <div className="k">Bill photo</div>
                <a href={r.billPhotoUrl} target="_blank" rel="noreferrer"><img src={r.billPhotoUrl} alt="Bill" /></a>
              </div>
            )}
          </div>
        )}
        {r.attachmentUrl && (
          <p style={{ marginTop: 10 }}>
            <a href={r.attachmentUrl} target="_blank" rel="noreferrer">View attached invoice / quotation ↗</a>
          </p>
        )}
        {r.payment?.reference && (
          <div className="success" style={{ marginTop: 14, marginBottom: 0 }}>
            Paid on {new Date(r.payment.date).toLocaleDateString('en-IN')} via {r.payment.mode} · Ref: {r.payment.reference}
            {r.payment.proofUrl && <> · <a href={r.payment.proofUrl} target="_blank" rel="noreferrer">proof ↗</a></>}
          </div>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {/* Employee actions */}
      {isOwner && ['draft', 'sent_back'].includes(r.status) && (
        <div className="card">
          <h2>Your request needs action</h2>
          {r.status === 'sent_back' && r.financeAction?.remarks && (
            <p style={{ margin: '8px 0' }}>Finance remarks: <b>{r.financeAction.remarks}</b></p>
          )}
          <div className="btn-row">
            <button className="btn gold" onClick={() => act('submit')} disabled={busy}>
              {r.status === 'sent_back' ? 'Resubmit' : 'Submit for approval'}
            </button>
          </div>
        </div>
      )}

      {/* Finance review */}
      {['finance', 'admin'].includes(user.role) && r.status === 'submitted' && (
        <div className="card">
          <h2>Finance review</h2>
          <div className="field" style={{ marginTop: 10 }}>
            <label>Remarks (visible to the requester)</label>
            <textarea rows="2" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          <div className="btn-row">
            <button className="btn sage" onClick={() => decide('finance', 'approve')} disabled={busy}>Approve</button>
            <button className="btn ghost" onClick={() => decide('finance', 'send_back')} disabled={busy}>Send back</button>
            <button className="btn danger" onClick={() => decide('finance', 'reject')} disabled={busy}>Reject</button>
          </div>
          <p style={{ marginTop: 10, fontSize: 13, color: '#8b5e3c' }}>
            {r.needsAdmin
              ? 'Next: Operations, then Admin approval (above threshold).'
              : 'Next: Operations approval.'}
          </p>
        </div>
      )}

      {/* Operations review */}
      {['operations', 'admin'].includes(user.role) && r.status === 'finance_approved' && (
        <div className="card">
          <h2>Operations approval</h2>
          {r.financeAction?.remarks && <p style={{ margin: '8px 0' }}>Finance remarks: <b>{r.financeAction.remarks}</b></p>}
          <div className="field" style={{ marginTop: 10 }}>
            <label>Remarks</label>
            <textarea rows="2" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          <div className="btn-row">
            <button className="btn sage" onClick={() => decide('operations', 'approve')} disabled={busy}>Approve</button>
            <button className="btn ghost" onClick={() => decide('operations', 'send_back')} disabled={busy}>Send back</button>
            <button className="btn danger" onClick={() => decide('operations', 'reject')} disabled={busy}>Reject</button>
          </div>
          {r.needsAdmin && <p style={{ marginTop: 10, fontSize: 13, color: '#8b5e3c' }}>
            Above threshold — Admin approval will also be required after this.
          </p>}
        </div>
      )}

      {/* Admin review */}
      {user.role === 'admin' && r.status === 'operations_approved' && (
        <div className="card">
          <h2>Admin approval</h2>
          {r.financeAction?.remarks && <p style={{ margin: '8px 0' }}>Finance remarks: <b>{r.financeAction.remarks}</b></p>}
          {r.operationsAction?.remarks && <p style={{ margin: '8px 0' }}>Operations remarks: <b>{r.operationsAction.remarks}</b></p>}
          <div className="field" style={{ marginTop: 10 }}>
            <label>Remarks</label>
            <textarea rows="2" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>
          <div className="btn-row">
            <button className="btn sage" onClick={() => decide('admin', 'approve')} disabled={busy}>Approve</button>
            <button className="btn ghost" onClick={() => decide('admin', 'send_back')} disabled={busy}>Send back</button>
            <button className="btn danger" onClick={() => decide('admin', 'reject')} disabled={busy}>Reject</button>
          </div>
        </div>
      )}

      {/* Record payment */}
      {isApprover && r.status === 'approved' && (
        <div className="card">
          <h2>Record payment</h2>
          <div className="form-grid" style={{ marginTop: 10 }}>
            <div className="field">
              <label>Mode</label>
              <select value={pay.mode} onChange={(e) => setPay({ ...pay, mode: e.target.value })}>
                <option>UPI</option><option>NEFT</option><option>IMPS</option><option>Cash</option><option>Cheque</option>
              </select>
            </div>
            <div className="field">
              <label>UTR / reference no. *</label>
              <input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} />
            </div>
            <div className="field full">
              <label>Payment proof link (screenshot)</label>
              <input value={pay.proofUrl} onChange={(e) => setPay({ ...pay, proofUrl: e.target.value })} />
            </div>
          </div>
          <div className="btn-row">
            <button className="btn gold" onClick={() => act('pay', pay)} disabled={busy}>Mark as paid</button>
          </div>
        </div>
      )}

      {/* Close */}
      {isApprover && r.status === 'paid' && (
        <div className="card">
          <div className="btn-row" style={{ marginTop: 0 }}>
            <button className="btn primary" onClick={() => act('close')} disabled={busy}>Close request</button>
          </div>
        </div>
      )}

      {/* Audit trail */}
      <div className="card">
        <h2>Activity</h2>
        <ul className="timeline" style={{ marginTop: 12 }}>
          {logs.map((l) => (
            <li key={l._id}>
              <b>{ACTION_LABELS[l.action] || l.action}</b> — {l.byName} ({l.byRole})
              {l.remarks && <> · “{l.remarks}”</>}
              <div className="t-when">{new Date(l.createdAt).toLocaleString('en-IN')}</div>
            </li>
          ))}
        </ul>
      </div>

      <button className="btn ghost" onClick={() => nav(-1)}>← Back</button>
    </>
  );
}
