import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { api } from '../services/api';
import { Async, Field, PageHead, useToast } from '../components/ui';

export default function Settings() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const runtime = useApi('/coding/runtime');
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [del, setDel] = useState('');
  const [busy, setBusy] = useState(false);
  const [editor, setEditor] = useState(() => { try { return localStorage.getItem('bb_editor') || 'monaco'; } catch { return 'monaco'; } });

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast('New passwords do not match.', 'error');
    setBusy(true);
    try { const r = await api.post('/auth/change-password', pw); toast(r.message); setPw({ currentPassword: '', newPassword: '', confirm: '' }); }
    catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  };
  const deleteAccount = async () => {
    if (!window.confirm('This permanently deletes your account and ALL your progress. Continue?')) return;
    try { await api.del('/auth/account', { password: del }); logout(); navigate('/'); }
    catch (err) { toast(err.message, 'error'); }
  };

  return (
    <>
      <PageHead title="Settings" subtitle="Account security, editor preference and system status." />
      <div className="grid grid-2" style={{ alignItems: 'start' }}>
        <form className="card stack" onSubmit={changePassword}>
          <h3>Change password</h3>
          <Field label="Current password"><input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></Field>
          <Field label="New password" hint="At least 8 characters with letters and numbers."><input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></Field>
          <Field label="Confirm new password"><input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></Field>
          <button className="btn" disabled={busy}>Update password</button>
        </form>
        <div className="stack">
          <div className="card stack">
            <h3>Code editor</h3>
            <label className="checkbox"><input type="radio" name="ed" checked={editor === 'monaco'} onChange={() => { setEditor('monaco'); localStorage.setItem('bb_editor', 'monaco'); toast('Monaco editor selected'); }} />Monaco (VS Code editor, needs internet to load)</label>
            <label className="checkbox"><input type="radio" name="ed" checked={editor === 'simple'} onChange={() => { setEditor('simple'); localStorage.setItem('bb_editor', 'simple'); toast('Simple editor selected'); }} />Simple text editor (works offline)</label>
          </div>
          <div className="card">
            <h3>Code execution status</h3>
            <Async state={runtime}>{(r) => (<><p className="small"><strong>Mode:</strong> {r.mode}</p><p className="small">{r.message}</p><div className="row">{Object.entries(r.languages).map(([l, ok]) => <span key={l} className={`badge ${ok ? 'easy' : 'hard'}`}>{l}: {ok ? 'available' : 'unavailable'}</span>)}</div></>)}</Async>
          </div>
          <div className="card stack" style={{ borderColor: '#fecaca' }}>
            <h3 style={{ color: 'var(--red)' }}>Delete account</h3>
            <p className="small muted" style={{ margin: 0 }}>Deletes your profile, progress, submissions, resumes and portfolio. This cannot be undone.</p>
            <Field label="Confirm with your password"><input className="input" type="password" value={del} onChange={(e) => setDel(e.target.value)} /></Field>
            <button className="btn btn-danger" disabled={!del} onClick={deleteAccount}>Delete my account</button>
          </div>
        </div>
      </div>
    </>
  );
}
