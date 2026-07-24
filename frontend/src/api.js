const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const headers = () => {
  const token = localStorage.getItem('bi_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

async function handle(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
  return data;
}

// Wrap fetch so a dead/wrong backend gives a clear, actionable message
async function call(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { headers: headers(), ...options });
  } catch {
    throw new Error(
      `Cannot reach the server at ${BASE}. ` +
      `Check that the backend is running and that VITE_API_URL in frontend/.env matches its port, then restart "npm run dev".`
    );
  }
  return handle(res);
}

export const api = {
  get: (path) => call(path),
  post: (path, body) => call(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => call(path, { method: 'PUT', body: JSON.stringify(body) }),
  del: (path) => call(path, { method: 'DELETE' }),
  exportUrl: () => `${BASE}/api/dashboard/export`,
  base: BASE
};

export const money = (n) =>
  '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// --- Image uploads (Cloudinary, unsigned) ---
const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadsEnabled = () => Boolean(CLOUD && PRESET);

export async function uploadImage(file) {
  if (!uploadsEnabled()) {
    throw new Error('Image uploads are not set up yet. Ask an admin to configure Cloudinary.');
  }
  const fd = new FormData();
  fd.append('file', file);
  fd.append('upload_preset', PRESET);
  let res;
  try {
    res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: fd });
  } catch {
    throw new Error('Could not reach the image service. Check your connection and try again.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error?.message || 'Image upload failed.');
  return data.secure_url;
}
