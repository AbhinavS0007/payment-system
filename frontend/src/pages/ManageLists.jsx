import { useEffect, useState } from 'react';
import { api } from '../api';

function ListManager({ title, endpoint, noun }) {
  const [items, setItems] = useState(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // { id, name }

  const load = () => api.get(endpoint).then(setItems).catch((e) => { setError(e.message); setItems([]); });
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!name.trim()) return;
    setError('');
    try { await api.post(endpoint, { name: name.trim() }); setName(''); load(); }
    catch (e) { setError(e.message); }
  };

  const saveEdit = async () => {
    setError('');
    try { await api.put(`${endpoint}/${editing.id}`, { name: editing.name.trim() }); setEditing(null); load(); }
    catch (e) { setError(e.message); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.name}"? Existing requests keep this ${noun} on record; it just won't be selectable anymore.`)) return;
    setError('');
    try { await api.del(`${endpoint}/${item._id}`); load(); }
    catch (e) { setError(e.message); }
  };

  return (
    <div className="card">
      <h2>{title}</h2>
      {error && <div className="error" style={{ marginTop: 10 }}>{error}</div>}
      <div className="btn-row" style={{ marginTop: 12, gap: 8 }}>
        <input
          style={{ maxWidth: 320 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={`Add a ${noun}…`}
        />
        <button className="btn gold" onClick={add}>Add</button>
      </div>

      {items === null ? (
        <p className="hint" style={{ marginTop: 14 }}>Loading…</p>
      ) : items.length === 0 ? (
        <p className="hint" style={{ marginTop: 14 }}>Nothing here yet. Add your first {noun} above.</p>
      ) : (
        <table style={{ marginTop: 14 }}>
          <tbody>
            {items.map((item) => (
              <tr key={item._id}>
                <td style={{ width: '100%' }}>
                  {editing?.id === item._id ? (
                    <input
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                      onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                      style={{ maxWidth: 320 }}
                    />
                  ) : (
                    <b>{item.name}</b>
                  )}
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {editing?.id === item._id ? (
                    <>
                      <button className="btn sage" onClick={saveEdit}>Save</button>{' '}
                      <button className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="btn ghost" onClick={() => setEditing({ id: item._id, name: item.name })}>Rename</button>{' '}
                      <button className="btn danger" onClick={() => remove(item)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function ManageLists() {
  return (
    <>
      <div className="page-head"><h1>Manage Lists</h1></div>
      <ListManager title="Projects / sites" endpoint="/api/projects" noun="project" />
      <ListManager title="Categories" endpoint="/api/categories" noun="category" />
    </>
  );
}
