import { useRef, useState } from 'react';
import { uploadImage, uploadsEnabled } from '../api';

// Compact photo attachment: "Take photo" opens the camera on phones/tablets,
// "Upload photo" opens the file picker. Meant to sit under a text input.
export default function ImageUpload({ caption, value, onChange }) {
  const camRef = useRef(null);
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!uploadsEnabled()) return null;

  const handle = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr(''); setBusy(true);
    try {
      onChange(await uploadImage(file));
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="uploader">
      {caption && <span className="uploader-cap">{caption}</span>}
      <input ref={camRef} type="file" accept="image/*" capture="environment" onChange={handle} hidden />
      <input ref={fileRef} type="file" accept="image/*" onChange={handle} hidden />
      {value ? (
        <div className="upload-preview">
          <a href={value} target="_blank" rel="noreferrer"><img src={value} alt={caption || 'attachment'} /></a>
          <button type="button" className="btn ghost" onClick={() => onChange('')}>Remove</button>
        </div>
      ) : (
        <div className="uploader-btns">
          <button type="button" className="btn ghost" onClick={() => camRef.current?.click()} disabled={busy}>📷 Take photo</button>
          <button type="button" className="btn ghost" onClick={() => fileRef.current?.click()} disabled={busy}>⬆ Upload photo</button>
        </div>
      )}
      {busy && <span className="hint">Uploading…</span>}
      {err && <div className="error" style={{ marginTop: 6 }}>{err}</div>}
    </div>
  );
}
