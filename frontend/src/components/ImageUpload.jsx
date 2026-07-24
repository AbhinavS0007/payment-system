import { useState } from 'react';
import { uploadImage, uploadsEnabled } from '../api';

// Upload or capture a photo. On mobile, `capture` opens the camera directly.
export default function ImageUpload({ label, value, onChange, hint, full }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const enabled = uploadsEnabled();

  const pick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(''); setBusy(true);
    try {
      onChange(await uploadImage(file));
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  return (
    <div className={`field${full ? ' full' : ''}`}>
      <label>{label}</label>
      {value ? (
        <div className="upload-preview">
          <a href={value} target="_blank" rel="noreferrer"><img src={value} alt={label} /></a>
          <button type="button" className="btn ghost" onClick={() => onChange('')}>Remove</button>
        </div>
      ) : (
        <input type="file" accept="image/*" capture="environment" onChange={pick} disabled={busy || !enabled} />
      )}
      {busy && <p className="hint">Uploading…</p>}
      {!enabled && <p className="hint">Image uploads aren’t configured yet.</p>}
      {hint && !value && <p className="hint">{hint}</p>}
      {err && <div className="error" style={{ marginTop: 8 }}>{err}</div>}
    </div>
  );
}
