import { useEffect, useState } from 'react';
import { api } from '../api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [f, setF] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');

  const load = () => api.get('/api/users').then(setUsers).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  const create = async () => {
    setError(''); setOk('');
    try {
      await api.post('/api/users', f);
      setOk(`Account created for ${f.name}. Share their email and password with them.`);
      setF({ name: '', email: '', password: '', role: 'employee' });
      load();
    } catch (e) { setError(e.message); }
  };

  const toggle = async (u) => {
    await api.put(`/api/users/${u._id}`, { active: !u.active });
    load();
  };

  const changeRole = async (u, role) => {
    await api.put(`/api/users/${u._id}`, { role });
    load();
  };

  return (
    <>
      <div className="page-head"><h1>Team</h1></div>

      <div className="card">
        <h2>Add team member</h2>
        {error && <div className="error" style={{ marginTop: 10 }}>{error}</div>}
        {ok && <div className="success" style={{ marginTop: 10 }}>{ok}</div>}
        <div className="form-grid" style={{ marginTop: 12 }}>
          <div className="field"><label>Name</label>
            <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div className="field"><label>Email</label>
            <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div className="field"><label>Temporary password</label>
            <input value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <div className="field"><label>Role</label>
            <select value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
              <option value="employee">Employee</option>
              <option value="finance">Finance</option>
              <option value="operations">Operations</option>
              <option value="admin">Admin</option>
            </select></div>
        </div>
        <div className="btn-row"><button className="btn gold" onClick={create}>Create account</button></div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'auto' }}>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td><b>{u.name}</b></td>
                <td>{u.email}</td>
                <td>
                  <select value={u.role} onChange={(e) => changeRole(u, e.target.value)} style={{ width: 130 }}>
                    <option value="employee">Employee</option>
                    <option value="finance">Finance</option>
                    <option value="operations">Operations</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td>{u.active ? <span className="badge approved">Active</span> : <span className="badge rejected">Deactivated</span>}</td>
                <td><button className="btn ghost" onClick={() => toggle(u)}>{u.active ? 'Deactivate' : 'Reactivate'}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
